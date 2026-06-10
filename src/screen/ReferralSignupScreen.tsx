// @ts-nocheck
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  BackHandler,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Toast from "react-native-toast-message"
import { Colors } from "../constants/colors"
import Button from "../components/Button/PrimaryButton"
import ControlledAuthField from "../components/Auth/ControlledAuthField"
import PasswordChecklist from "../components/Auth/PasswordChecklist"
import LegalWebViewScreen from "./LegalWebViewScreen"
import {
  referralSignupSchema,
  REFERRAL_PASSWORD_RULES,
} from "../schemas/authSchemas"
import { LegalDoc } from "../constants/legal"
import { authService } from "../services/authService"
import { storageService } from "../services/storageService"
import styles from "../styles/ReferralSignupScreen.styles"

interface ReferralSignupScreenProps {
  referrerUsername: string
  isDarkMode?: boolean
  pendingOtpEmail?: string
  pendingOtpToken?: string
  onBack: () => void
  onContinueToOtp?: (phone: string, verificationToken: string) => void
  onResumOtp?: () => void
}

const DRAFT_KEY = "referral_signup_draft"

const TEXT_FIELDS: Array<{
  name:
    | "firstName"
    | "lastName"
    | "mobileNumber"
    | "email"
    | "username"
    | "referralCode"
  label: string
  keyboard?: any
  autoCapitalize?: "none" | "words"
  required?: boolean
  hint?: string
}> = [
  { name: "firstName", label: "First Name", autoCapitalize: "words", required: true },
  { name: "lastName", label: "Last Name", autoCapitalize: "words", required: true },
  {
    name: "mobileNumber",
    label: "Mobile Number",
    keyboard: "phone-pad",
    required: true,
    hint: "Use 11 digits only.",
  },
  { name: "email", label: "Email Address", keyboard: "email-address", autoCapitalize: "none", hint: "Optional" },
  {
    name: "username",
    label: "Username",
    autoCapitalize: "none",
    required: true,
    hint: "Letters and numbers only, no spaces or symbols.",
  },
  { name: "referralCode", label: "Referral Code", required: true },
]

export default function ReferralSignupScreen({
  referrerUsername,
  isDarkMode = false,
  pendingOtpEmail,
  pendingOtpToken,
  onBack,
  onContinueToOtp,
  onResumOtp,
}: ReferralSignupScreenProps) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successModalVisible, setSuccessModalVisible] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)

  const variant = isDarkMode ? "dark" : "light"
  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f8fbff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
  }

  const { control, handleSubmit, setValue, setError, reset, watch, getValues } =
    useForm({
      resolver: zodResolver(referralSignupSchema),
      mode: "onTouched",
      defaultValues: {
        firstName: "",
        lastName: "",
        mobileNumber: "",
        email: "",
        username: "",
        referralCode: referrerUsername || "",
        password: "",
        passwordConfirmation: "",
        acceptedTerms: false,
      },
    })

  const acceptedTerms = useWatch({ control, name: "acceptedTerms" })

  // Load saved draft on mount.
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await storageService.getItem(DRAFT_KEY)
        if (saved && saved.trim() !== "") {
          const parsed = JSON.parse(saved)
          reset({
            firstName: parsed.firstName || "",
            lastName: parsed.lastName || "",
            mobileNumber: parsed.mobileNumber || "",
            email: parsed.email || "",
            username: parsed.username || "",
            referralCode: referrerUsername || parsed.referralCode || "",
            password: parsed.password || "",
            passwordConfirmation: parsed.passwordConfirmation || "",
            acceptedTerms: false,
          })
        }
      } catch {
        console.log("Could not load saved form data")
      }
    })()
  }, [])

  // Persist draft on any change WITHOUT re-rendering (watch subscription).
  useEffect(() => {
    const sub = watch((value) => {
      storageService
        .setItem(DRAFT_KEY, JSON.stringify(value))
        .catch(() => console.log("Could not save form draft"))
    })
    return () => sub.unsubscribe()
  }, [watch])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack])

  const onSubmit = handleSubmit(async (v) => {
    setLoading(true)
    try {
      const payload = {
        first_name: v.firstName,
        last_name: v.lastName,
        middle_name: "",
        name: `${v.firstName} ${v.lastName}`.trim(),
        email: v.email || null,
        username: v.username,
        phone: v.mobileNumber,
        birth_date: "2000-01-01",
        gender: "male",
        occupation: "Not specified",
        work_location: "local",
        country: "Philippines",
        referred_by: v.referralCode,
        password: v.password,
        password_confirmation: v.passwordConfirmation,
        address: "Not specified",
        barangay: "Not specified",
        city: "Not specified",
        province: "Not specified",
        region: "Not specified",
        zip_code: "0000",
      }
      const response = await authService.mobileRegister(payload)
      if (!response) {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: "Please try again.",
        })
        return
      }

      if (response.requires_otp) {
        const verificationToken = (response?.verification_token || "").trim()
        if (!verificationToken) {
          Toast.show({
            type: "error",
            text1: "Registration failed",
            text2: "Missing verification token. Please try again.",
          })
          return
        }
        try {
          await authService.sendSmsOtp(verificationToken, v.mobileNumber)
          await storageService.setItem(DRAFT_KEY, "")
          Toast.show({
            type: "success",
            text1: response.message || "Registration successful",
            text2:
              "A 4-digit verification code has been sent to your phone number.",
          })
          setTimeout(() => {
            onContinueToOtp?.(v.mobileNumber, verificationToken)
          }, 900)
        } catch (smsError: any) {
          setError("mobileNumber", {
            message: smsError.message || "Failed to send SMS OTP",
          })
        }
      } else {
        await storageService.setItem(DRAFT_KEY, "")
        setSuccessModalVisible(true)
      }
    } catch (error: any) {
      // Map backend field errors onto the form.
      const fieldMap: Record<string, string> = {
        first_name: "firstName",
        last_name: "lastName",
        username: "username",
        email: "email",
        phone: "mobileNumber",
        password: "password",
        password_confirmation: "passwordConfirmation",
        referred_by: "referralCode",
      }
      const backendErrors = error.details?.errors
      let mapped = false
      if (backendErrors) {
        Object.entries(backendErrors).forEach(
          ([backendField, messages]: [string, any]) => {
            const key = fieldMap[backendField]
            const message = Array.isArray(messages) ? messages[0] : messages
            if (key && message) {
              setError(key as any, { message })
              mapped = true
            }
          }
        )
      }
      if (!mapped) {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: error.message || "Please try again.",
        })
      }
    } finally {
      setLoading(false)
    }
  })

  function startOver() {
    reset({
      firstName: "",
      lastName: "",
      mobileNumber: "",
      email: "",
      username: "",
      referralCode: referrerUsername || "",
      password: "",
      passwordConfirmation: "",
      acceptedTerms: false,
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(59,130,246,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.containerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerGreeting, { color: colors.text }]}>
              Register
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSec }]}>
              Complete your registration
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.scrollableContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={120}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Array.from({ length: Math.ceil(TEXT_FIELDS.length / 2) }).map(
              (_, rowIndex) => {
                const f1 = TEXT_FIELDS[rowIndex * 2]
                const f2 = TEXT_FIELDS[rowIndex * 2 + 1]
                const disabled = (n: string) =>
                  n === "referralCode" && !!referrerUsername
                return (
                  <View key={`row-${rowIndex}`} style={styles.fieldRow}>
                    {f1 ? (
                      <ControlledAuthField
                        control={control}
                        name={f1.name}
                        variant={variant}
                        containerStyle={styles.halfField}
                        label={f1.label}
                        required={f1.required}
                        hint={
                          f1.name === "referralCode" && referrerUsername
                            ? "Pre-filled from your referral link."
                            : f1.hint
                        }
                        keyboardType={f1.keyboard}
                        autoCapitalize={f1.autoCapitalize ?? "words"}
                        editable={!disabled(f1.name)}
                      />
                    ) : null}
                    {f2 ? (
                      <ControlledAuthField
                        control={control}
                        name={f2.name}
                        variant={variant}
                        containerStyle={styles.halfField}
                        label={f2.label}
                        required={f2.required}
                        hint={
                          f2.name === "referralCode" && referrerUsername
                            ? "Pre-filled from your referral link."
                            : f2.hint
                        }
                        keyboardType={f2.keyboard}
                        autoCapitalize={f2.autoCapitalize ?? "words"}
                        editable={!disabled(f2.name)}
                      />
                    ) : null}
                  </View>
                )
              }
            )}

            <ControlledAuthField
              control={control}
              name="password"
              variant={variant}
              label="Password"
              required
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
            <ControlledAuthField
              control={control}
              name="passwordConfirmation"
              variant={variant}
              label="Password Confirmation"
              required
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              rightIcon={
                showConfirmPassword ? "eye-off-outline" : "eye-outline"
              }
              onRightIconPress={() => setShowConfirmPassword((v) => !v)}
            />
            <PasswordChecklist
              control={control}
              name="password"
              confirmName="passwordConfirmation"
              rules={REFERRAL_PASSWORD_RULES}
              matchLabel="Should be Match"
              variant={variant}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Fixed Bottom Footer */}
      <LinearGradient
        colors={isDarkMode ? ["#0f172a", "#1e293b"] : ["#f0f9ff", "#f0fdf4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bottomFooter,
          { backgroundColor: colors.containerBg, borderTopColor: colors.border },
        ]}
      >
        <View
          style={{
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={[
              styles.termsBox,
              { borderColor: colors.border, marginBottom: 8 },
            ]}
          >
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setValue("acceptedTerms", !acceptedTerms, {
                  shouldValidate: true,
                })
              }
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!acceptedTerms }}
            >
              <View
                style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={11} color={Colors.white} />
                )}
              </View>
              <Text style={[styles.termsText, { color: colors.text }]}>
                I have read and agree to the{" "}
                <Text style={styles.linkText} onPress={() => setLegalDoc("terms")}>
                  Terms and Conditions
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => setLegalDoc("privacy")}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </TouchableOpacity>
          </View>

          {pendingOtpEmail && pendingOtpToken ? (
            <>
              <Button
                title="CONTINUE VERIFICATION"
                onPress={onResumOtp}
                style={[
                  styles.signUpBtn,
                  { backgroundColor: Colors.sky, marginBottom: 8 },
                ]}
              />
              <Button title="START OVER" onPress={startOver} style={styles.signUpBtn} />
            </>
          ) : (
            <Button
              title="SIGN UP"
              onPress={onSubmit}
              loading={loading}
              disabled={!acceptedTerms}
              style={styles.signUpBtn}
            />
          )}
        </View>
      </LinearGradient>

      <Modal visible={successModalVisible} transparent animationType="fade">
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.8)"
                : "rgba(0, 0, 0, 0.5)",
            },
          ]}
        >
          <View
            style={[
              styles.successModalContent,
              { backgroundColor: colors.containerBg },
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.sky} />
            </View>
            <Text style={[styles.successModalTitle, { color: colors.text }]}>
              Registration Successful!
            </Text>
            <Text style={[styles.successModalMessage, { color: colors.textSec }]}>
              Your account has been created successfully. You can now log in with
              your credentials.
            </Text>
            <View style={styles.successModalFooter}>
              <TouchableOpacity
                style={[styles.successCloseBtn, { borderColor: colors.border }]}
                onPress={() => onBack()}
              >
                <Text style={[styles.successCloseBtnText, { color: colors.text }]}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successLoginBtn} onPress={() => onBack()}>
                <Text style={styles.successLoginBtnText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={legalDoc !== null}
        animationType="slide"
        onRequestClose={() => setLegalDoc(null)}
      >
        {legalDoc ? (
          <LegalWebViewScreen
            doc={legalDoc}
            isDarkMode={isDarkMode}
            onClose={() => setLegalDoc(null)}
          />
        ) : null}
      </Modal>
    </View>
  )
}
