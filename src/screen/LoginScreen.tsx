// @ts-nocheck
import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  BackHandler,
  Alert,
} from "react-native"
import { Image } from "expo-image"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useVideoPlayer, VideoView } from "expo-video"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import * as WebBrowser from "expo-web-browser"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import { Colors } from "../constants/colors"
import Button from "../components/Button/PrimaryButton"
import ControlledAuthField from "../components/Auth/ControlledAuthField"
import LegalWebViewScreen from "./LegalWebViewScreen"
import { loginSchema } from "../schemas/authSchemas"
import { LegalDoc } from "../constants/legal"
import { authService } from "../services/authService"
import BiometricUtils from "../utils/biometricUtils"
import { getFCMToken } from "../utils/fcmUtils"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import styles from "../styles/LoginScreen.styles"

WebBrowser.maybeCompleteAuthSession()

const LOGIN_BACKGROUND_VIDEO_URL =
  "https://res.cloudinary.com/dc05ncs6l/video/upload/v1780726529/afhome_go2re6.mp4"

type AuthStep = "login" | "2fa" | "mfa"

/**
 * Background video isolated in a memoized component so form state changes
 * never re-render the video.
 */
const LoginBackground = React.memo(function LoginBackground() {
  const player = useVideoPlayer({ uri: LOGIN_BACKGROUND_VIDEO_URL }, (p) => {
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

export default function LoginScreen({
  onGoToSignup,
  onGoToIndex,
  onAuthenticated,
  onResetOnboarding,
}: {
  onGoToSignup?: () => void
  onGoToIndex?: () => void
  onAuthenticated?: (
    user?: { id: string; email: string; name: string; avatar_url?: string },
    token?: string
  ) => void
  onResetOnboarding?: () => Promise<void>
}) {
  const { control, handleSubmit, trigger, getValues, reset } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
    mode: "onTouched",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>("login")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [mfaPolling, setMfaPolling] = useState(false)
  const otpInputRef = useRef<TextInput | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [savedUser, setSavedUser] = useState<{
    id: string
    email: string
    name: string
    avatar_url?: string
  } | null>(null)
  const [showRememberedUserUI, setShowRememberedUserUI] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)

  useEffect(() => {
    loadSavedUser()
    checkBiometric()
  }, [])

  useEffect(() => {
    if (authStep === "2fa") {
      const timer = setTimeout(() => otpInputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [authStep])

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

  async function loadSavedUser() {
    try {
      const saved = await AsyncStorage.getItem("rememberedUser")
      if (saved) {
        const user = JSON.parse(saved)
        setSavedUser(user)
        setShowRememberedUserUI(true)
      }
    } catch (error) {
      console.error("Failed to load saved user:", error)
    }
  }

  async function checkBiometric() {
    try {
      const hasCredential = await BiometricUtils.hasBiometricCredential()
      const available = await BiometricUtils.isBiometricAvailable()
      setBiometricAvailable(hasCredential && available)
    } catch (error) {
      console.error("[LoginScreen] Failed to check biometric:", error)
    }
  }

  async function saveUserCredentials(user: {
    id: string
    email: string
    name: string
    avatar_url?: string
  }) {
    try {
      await AsyncStorage.setItem("rememberedUser", JSON.stringify(user))
    } catch (error) {
      console.error("Failed to save user:", error)
    }
  }

  async function clearSavedUser() {
    try {
      await AsyncStorage.removeItem("rememberedUser")
      setSavedUser(null)
      setShowRememberedUserUI(false)
      reset({ identifier: "", password: "" })
    } catch (error) {
      console.error("Failed to clear saved user:", error)
    }
  }

  // Shared post-login handling for 2FA / MFA / success.
  function handleLoginSuccess(response: any) {
    Toast.show({ type: "success", text1: "Login successful!" })
    setTimeout(
      () =>
        onAuthenticated?.(response.user, response.token ?? response.accessToken),
      700
    )
  }

  function handleLoginError(error: any) {
    if (error.type === "2FA_REQUIRED") {
      setAuthToken(error.token)
      setAuthStep("2fa")
      Toast.show({ type: "info", text1: "OTP required", text2: error.message })
    } else if (error.type === "MFA_APPROVAL_REQUIRED") {
      setAuthToken(error.token)
      setAuthStep("mfa")
      Toast.show({
        type: "info",
        text1: "MFA approval required",
        text2: error.message,
      })
      startMfaPolling()
    } else {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: error.message || "Please try again.",
      })
    }
  }

  const onSignIn = handleSubmit(async (values) => {
    setLoading(true)
    try {
      const response = await authService.login(
        values.identifier,
        values.password
      )
      if (!response.user && !response.accessToken && !response.token) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Invalid credentials.",
        })
        return
      }
      if (rememberMe && response.user) {
        await saveUserCredentials(response.user)
      }
      handleLoginSuccess(response)
    } catch (error: any) {
      handleLoginError(error)
    } finally {
      setLoading(false)
    }
  })

  async function onRememberedLogin() {
    const valid = await trigger("password")
    if (!valid || !savedUser?.email) return
    setLoading(true)
    try {
      const response = await authService.login(
        savedUser.email,
        getValues("password")
      )
      if (!response.user && !response.accessToken && !response.token) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Invalid credentials.",
        })
        return
      }
      handleLoginSuccess(response)
    } catch (error: any) {
      handleLoginError(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBiometricLogin() {
    if (biometricLoading) return

    if (!biometricAvailable) {
      Alert.alert(
        "Enable Biometric Login",
        "Go to Profile > Security > Enable Biometric to use fingerprint login",
        [{ text: "OK", onPress: () => {} }]
      )
      return
    }

    setBiometricLoading(true)
    try {
      const authenticated = await BiometricUtils.authenticate()
      if (!authenticated) {
        setBiometricLoading(false)
        return
      }

      const credential = await BiometricUtils.getBiometricCredential()
      if (!credential) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            "Biometric credential not found. Please enable biometric login first.",
        })
        setBiometricLoading(false)
        return
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/mobile/login-biometric`,
        {
          device_id: credential.device_id,
          credential_token: credential.credential_token,
        }
      )

      const user = response.data?.user ?? response.data?.data?.user
      const token = response.data?.token ?? response.data?.data?.token

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome, ${user?.name || user?.email || "User"}!`,
        visibilityTime: 2000,
      })

      setTimeout(() => {
        onAuthenticated?.(user, token)
      }, 700)
    } catch (error: any) {
      console.error("[LoginScreen] Biometric login failed:", error)
      Toast.show({
        type: "error",
        text1: "Login Error",
        text2:
          error.response?.data?.message ||
          "Biometric login failed. Please try again.",
      })
    } finally {
      setBiometricLoading(false)
    }
  }

  async function handle2FAVerify() {
    if (!otp.trim()) {
      setOtpError("Please enter the OTP code")
      return
    }
    setLoading(true)
    setOtpError("")
    try {
      const twoFaResult = await authService.verify2FA(authToken!, otp)
      Toast.show({ type: "success", text1: "2FA verification successful!" })
      setTimeout(() => {
        setAuthStep("login")
        setOtp("")
        setAuthToken(null)
        setOtpError("")
        onAuthenticated?.(
          twoFaResult.user,
          twoFaResult.token ?? twoFaResult.accessToken
        )
      }, 700)
    } catch (error: any) {
      setOtpError(error.message || "2FA verification failed")
      setOtp("")
      setTimeout(() => otpInputRef.current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend2FA() {
    setLoading(true)
    try {
      await authService.resend2FA(authToken!)
      setOtpError("")
      Toast.show({ type: "success", text1: "OTP resent successfully" })
    } catch (error: any) {
      setOtpError(error.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  function startMfaPolling() {
    setMfaPolling(true)
    const interval = setInterval(async () => {
      try {
        const status = await authService.checkMFAStatus(authToken!)
        if (status.approved) {
          clearInterval(interval)
          setMfaPolling(false)
          Toast.show({
            type: "success",
            text1: "MFA approved!",
            text2: "Login successful.",
          })
          setTimeout(() => {
            setAuthStep("login")
            setAuthToken(null)
            onAuthenticated?.()
          }, 700)
        }
      } catch (error: any) {
        clearInterval(interval)
        setMfaPolling(false)
        Toast.show({
          type: "error",
          text1: "MFA check failed",
          text2: error.message || "Please try again.",
        })
      }
    }, 3000)
  }

  async function handleResendMFA() {
    setLoading(true)
    try {
      await authService.resendMFA(authToken!)
      Toast.show({ type: "success", text1: "MFA email resent" })
      startMfaPolling()
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to resend MFA",
        text2: error.message || "Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LoginBackground />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -100 : 0}
      >
        <View style={styles.spacer} />
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 1)"]}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />
        <SafeAreaView style={styles.contentSection} edges={["bottom"]}>
          <View style={styles.headerRow}>
            <Pressable
              style={styles.backButton}
              onPress={onGoToIndex}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>
            <View style={styles.logoSection}>
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/home_logo_zktlq8.png",
                }}
                style={styles.homeLogoImage}
                contentFit="contain"
                transition={200}
              />
              <Text style={styles.homeLogoText}>Home</Text>
            </View>
          </View>

          <View style={styles.headingSection}>
            <Text style={styles.heading}>Welcome back!</Text>
            <Text style={styles.subheading}>
              Sign in to your AF Home account
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showRememberedUserUI && savedUser ? (
              <>
                <View style={styles.profileSection}>
                  {savedUser.avatar_url ? (
                    <Image
                      source={{ uri: savedUser.avatar_url }}
                      style={styles.profilePicture}
                      transition={200}
                    />
                  ) : (
                    <View style={styles.profilePictureDefault}>
                      <Text style={styles.profilePictureDefaultText}>
                        {savedUser.name?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.profileName}>{savedUser.name}</Text>
                  <Text style={styles.profileEmail}>{savedUser.email}</Text>
                </View>

                <ControlledAuthField
                  control={control}
                  name="password"
                  label="Password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  onSubmitEditing={onRememberedLogin}
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword((v) => !v)}
                />
                <Button
                  title="Sign in"
                  onPress={onRememberedLogin}
                  loading={loading}
                  style={styles.signInBtn}
                />
                <TouchableOpacity
                  style={styles.notYouButton}
                  onPress={clearSavedUser}
                  disabled={loading}
                >
                  <Text style={styles.notYouText}>
                    Not you? Use a different account
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ControlledAuthField
                  control={control}
                  name="identifier"
                  label="Username or Email"
                  leftIcon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  rightIcon="finger-print"
                  rightIconActive={!biometricLoading}
                  onRightIconPress={handleBiometricLogin}
                />
                <ControlledAuthField
                  control={control}
                  name="password"
                  label="Password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  onSubmitEditing={onSignIn}
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword((v) => !v)}
                />
                <View style={styles.rememberMeRow}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setRememberMe((v) => !v)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={Colors.white}
                        />
                      )}
                    </View>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </TouchableOpacity>
                </View>
                <Button
                  title="Sign in"
                  onPress={onSignIn}
                  loading={loading}
                  style={styles.signInBtn}
                />

                <View style={styles.signupLinkSection}>
                  <Text style={styles.signupText}>
                    Don&apos;t have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={onGoToSignup}>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.legalFooter}>
              By continuing you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => setLegalDoc("terms")}>
                Terms
              </Text>{" "}
              and{" "}
              <Text
                style={styles.legalLink}
                onPress={() => setLegalDoc("privacy")}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal visible={authStep === "2fa"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Two-Factor Authentication</Text>
            <Text style={styles.modalSubtitle}>
              Enter the OTP code sent to your email
            </Text>
            <TextInput
              ref={otpInputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={(text) => {
                setOtp(text)
                if (otpError) setOtpError("")
              }}
              placeholder="Enter OTP"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            {otpError ? (
              <Text style={styles.otpErrorText}>{otpError}</Text>
            ) : null}
            <Button
              title="Verify"
              onPress={handle2FAVerify}
              loading={loading}
              style={styles.modalButton}
            />
            <TouchableOpacity
              style={styles.modalLink}
              onPress={handleResend2FA}
              disabled={loading}
            >
              <Text style={styles.modalLinkText}>Resend OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalLink}
              onPress={() => {
                setAuthStep("login")
                setOtp("")
                setAuthToken(null)
                setOtpError("")
              }}
            >
              <Text style={styles.modalLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={authStep === "mfa"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MFA Approval Required</Text>
            <Text style={styles.modalSubtitle}>
              Check your email for the approval link
            </Text>
            {mfaPolling ? (
              <Text style={styles.modalPolling}>Waiting for approval...</Text>
            ) : null}
            <TouchableOpacity
              style={styles.modalLink}
              onPress={handleResendMFA}
              disabled={loading}
            >
              <Text style={styles.modalLinkText}>Resend Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalLink}
              onPress={() => {
                setAuthStep("login")
                setAuthToken(null)
                setMfaPolling(false)
                setOtpError("")
              }}
            >
              <Text style={styles.modalLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
