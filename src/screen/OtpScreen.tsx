import React, { useEffect, useMemo, useRef, useState } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useVideoPlayer, VideoView } from "expo-video"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import Button from "../components/Button/PrimaryButton"
import { authService } from "../services/authService"
import styles from "../styles/OtpScreen.styles"

export default function OtpScreen({
  email,
  verificationToken,
  onBackToSignup,
  onSuccess,
}: {
  email: string
  verificationToken: string
  onBackToSignup?: () => void
  onSuccess?: () => void
}) {
  const [code, setCode] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [resendSeconds, setResendSeconds] = useState(50)
  const inputRefs = useRef<Array<TextInput | null>>([])
  const player = useVideoPlayer(
    "https://res.cloudinary.com/dc05ncs6l/video/upload/v1780969092/home-login_dja56x.mp4",
    (p) => {
      p.loop = true
      p.muted = true
      p.play()
    }
  )
  const maskedEmail = useMemo(() => {
    if (!email) return "jd***@gmail.com"
    const [name, domain] = email.split("@")
    const maskedName = name ? `${name.slice(0, 2)}***` : "jd***"
    return `${maskedName}@${domain || "gmail.com"}`
  }, [email])

  useEffect(() => {
    const timer = setInterval(() => {
      setResendSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function updateCode(index: number, value: string) {
    const digits = value.replace(/\D/g, "")
    const next = [...code]

    if (digits.length > 1) {
      const chars = digits.slice(0, 4).split("")
      for (let i = 0; i < 4; i += 1) {
        next[i] = chars[i] || ""
      }
      setCode(next)
      const focusIndex = Math.min(chars.length, 3)
      inputRefs.current[focusIndex]?.focus()
      return
    }

    next[index] = digits.slice(-1)
    setCode(next)

    if (digits && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleResend() {
    setResendSeconds(50)
    setMessage("A new verification code has been sent.")
  }

  async function handleVerify() {
    const otp = code.join("")
    if (otp.length !== 4) {
      setMessage("Please enter the 4-digit code.")
      return
    }

    setLoading(true)
    setMessage("")
    try {
      await authService.verifyRegisterOtp(verificationToken, otp)
      onSuccess?.()
    } catch (error: any) {
      setMessage(error.message || "OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.tabs}>
                <Pressable style={styles.tab}>
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
                Enter the 4-digit code we sent to your email to finish your
                registration.
              </Text>

              <View style={styles.iconWrap}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-outline" size={30} color="#0ea5e9" />
                </View>
              </View>

              <Text style={styles.centerTitle}>Check your Email</Text>
              <Text style={styles.centerSubtitle}>
                We sent a 4-digit verification code to
              </Text>
              <Text style={styles.emailText}>{maskedEmail}</Text>

              <View style={styles.codeRow}>
                {code.map((value, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref
                    }}
                    style={styles.codeInput}
                    value={value}
                    onChangeText={(text) => updateCode(index, text)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(index, nativeEvent.key)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {message ? (
                <Text style={styles.messageText}>{message}</Text>
              ) : null}

              <Button
                title="VERIFY CODE"
                onPress={handleVerify}
                loading={loading}
                style={styles.verifyBtn}
              />

              <View style={styles.bottomRow}>
                <TouchableOpacity onPress={onBackToSignup}>
                  <Text style={styles.backText}>Back to sign up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendSeconds > 0}
                >
                  <Text
                    style={[
                      styles.resendText,
                      resendSeconds > 0 && styles.resendDisabled,
                    ]}
                  >
                    {resendSeconds > 0
                      ? `Resend in ${resendSeconds}s`
                      : "Resend code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
