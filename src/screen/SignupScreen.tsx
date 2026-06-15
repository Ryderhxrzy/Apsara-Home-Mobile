import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  BackHandler,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useVideoPlayer, VideoView } from "expo-video"
import { LinearGradient } from "expo-linear-gradient"
import Ionicons from "../components/ui/Icon"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Toast from "react-native-toast-message"
import { Colors } from "../constants/colors"
import Button from "../components/Button/PrimaryButton"
import ControlledAuthField from "../components/Auth/ControlledAuthField"
import PasswordChecklist from "../components/Auth/PasswordChecklist"
import LegalWebViewScreen from "./LegalWebViewScreen"
import { signupSchema, SIGNUP_DEFAULTS } from "../schemas/authSchemas"
import { LegalDoc } from "../constants/legal"
import { authService } from "../services/authService"
import styles from "../styles/SignupScreen.styles"

type SignupScreenProps = {
  onGoToLogin?: () => void
  onGoToIndex?: () => void
  onContinueToOtp?: (email: string, verificationToken: string) => void
}

const SIGNUP_BACKGROUND_VIDEO_URL =
  "https://res.cloudinary.com/dc05ncs6l/video/upload/v1780726529/afhome_go2re6.mp4"

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
  hint?: string
  required?: boolean
}> = [
  { name: "firstName", label: "First Name", autoCapitalize: "words", required: true },
  { name: "lastName", label: "Last Name", autoCapitalize: "words", required: true },
  {
    name: "mobileNumber",
    label: "Mobile Number",
    keyboard: "phone-pad",
    hint: "Use 11 digits only. Format 0929-226-0447.",
    required: true,
  },
  { name: "email", label: "Email Address", keyboard: "email-address", autoCapitalize: "none" },
  {
    name: "username",
    label: "Username",
    autoCapitalize: "none",
    hint: "Letters and numbers only, no spaces or symbols.",
    required: true,
  },
  { name: "referralCode", label: "Referral Code / Referral Link", required: true },
]

const SignupBackground = React.memo(function SignupBackground() {
  const player = useVideoPlayer({ uri: SIGNUP_BACKGROUND_VIDEO_URL }, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })
  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
    </>
  )
})

export default function SignupScreen({
  onGoToLogin,
  onGoToIndex,
  onContinueToOtp,
}: SignupScreenProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: SIGNUP_DEFAULTS,
    mode: "onTouched",
  })

  const acceptedTerms = useWatch({ control, name: "acceptedTerms" })

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (onGoToIndex) {
          onGoToIndex()
          return true
        }
        return false
      }
    )
    return () => backHandler.remove()
  }, [onGoToIndex])

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
      if (response.requires_otp && response.verification_token) {
        Toast.show({
          type: "success",
          text1: response.message || "Registration successful",
          text2: "A 4-digit verification code has been sent to your email.",
        })
        setTimeout(() => {
          onContinueToOtp?.(response.email, response.verification_token)
        }, 900)
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: error.message || "Please try again.",
      })
    } finally {
      setLoading(false)
    }
  })

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SignupBackground />
      <View style={styles.container}>
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.6)",
            "rgba(0, 0, 0, 0.8)",
          ]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.contentSection}>
          <View style={styles.card}>
            <Pressable
              style={styles.backButton}
              onPress={onGoToIndex}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>
            <View style={styles.header}>
              <View style={styles.tabs}>
                <Pressable style={styles.tab} onPress={onGoToLogin}>
                  <Text style={styles.tabText}>Sign In</Text>
                </Pressable>
                <Pressable style={[styles.tab, styles.tabActive]}>
                  <Text style={[styles.tabText, styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.heading}>Let&apos;s Get Started!</Text>
              <Text style={styles.subheading}>
                Please enter the required details to create your account.
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.formScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {Array.from({ length: Math.ceil(TEXT_FIELDS.length / 2) }).map(
                (_, rowIndex) => {
                  const f1 = TEXT_FIELDS[rowIndex * 2]
                  const f2 = TEXT_FIELDS[rowIndex * 2 + 1]
                  return (
                    <View key={`row-${rowIndex}`} style={styles.fieldRow}>
                      {f1 ? (
                        <ControlledAuthField
                          control={control}
                          name={f1.name}
                          containerStyle={styles.halfField}
                          label={f1.label}
                          required={f1.required}
                          hint={f1.hint}
                          keyboardType={f1.keyboard}
                          autoCapitalize={f1.autoCapitalize ?? "words"}
                        />
                      ) : null}
                      {f2 ? (
                        <ControlledAuthField
                          control={control}
                          name={f2.name}
                          containerStyle={styles.halfField}
                          label={f2.label}
                          required={f2.required}
                          hint={f2.hint}
                          keyboardType={f2.keyboard}
                          autoCapitalize={f2.autoCapitalize ?? "words"}
                        />
                      ) : null}
                    </View>
                  )
                }
              )}

              <ControlledAuthField
                control={control}
                name="password"
                label="Password"
                required
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                onRightIconPress={() => setShowPassword((v) => !v)}
              />
              <PasswordChecklist control={control} name="password" variant="dark" />

              <ControlledAuthField
                control={control}
                name="passwordConfirmation"
                label="Password Confirmation"
                required
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                rightIcon={
                  showConfirmPassword ? "eye-off-outline" : "eye-outline"
                }
                onRightIconPress={() => setShowConfirmPassword((v) => !v)}
              />

              <View style={styles.termsBox}>
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
                    style={[
                      styles.checkbox,
                      acceptedTerms && styles.checkboxChecked,
                    ]}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={11} color={Colors.white} />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    I have read and agree to the{" "}
                    <Text
                      style={styles.linkText}
                      onPress={() => setLegalDoc("terms")}
                    >
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

              <Button
                title="SIGN UP"
                onPress={onSubmit}
                loading={loading}
                disabled={!acceptedTerms}
                style={styles.signUpBtn}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={legalDoc !== null}
        animationType="slide"
        onRequestClose={() => setLegalDoc(null)}
      >
        {legalDoc ? (
          <LegalWebViewScreen doc={legalDoc} onClose={() => setLegalDoc(null)} />
        ) : null}
      </Modal>
    </View>
  )
}
