import React from "react"
import { View, StyleSheet } from "react-native"
import Toast from "react-native-toast-message"
import { Colors } from "../../constants/colors"
import { useModalStore } from "../../store/modalStore"
import ReferralScreen from "../../screen/ReferralScreen"
import ReferralSignupScreen from "../../screen/ReferralSignupScreen"
import ReferralOtpScreen from "../../screen/ReferralOtpScreen"

interface ReferralSignupFlowProps {
  /** Referrer username from the deep link (owned by AppNavigator). */
  referralCode: string
  referrerProfile?: { name?: string; avatar_url?: string } | null
  isDarkMode?: boolean
  /**
   * Clears the deep-link referral data that AppNavigator owns
   * (referralCodeFromDeepLink + referrerProfileData), unmounting the flow.
   */
  onExit: () => void
}

/**
 * The referral signup flow (intro → signup → OTP), extracted from AppNavigator.
 * Step state lives in the Zustand modal store, so transitioning between steps
 * re-renders only this component — not the whole navigator. Behaviour mirrors
 * the original inline blocks exactly (including signup stacking over intro).
 */
export default function ReferralSignupFlow({
  referralCode,
  referrerProfile,
  isDarkMode = false,
  onExit,
}: ReferralSignupFlowProps) {
  const introOpen = useModalStore((s) => s.referralIntroOpen)
  const signupOpen = useModalStore((s) => s.referralSignupOpen)
  const otpOpen = useModalStore((s) => s.referralOtpOpen)
  const otpData = useModalStore((s) => s.referralOtpData)
  const openReferralSignup = useModalStore((s) => s.openReferralSignup)
  const closeReferralSignup = useModalStore((s) => s.closeReferralSignup)
  const openReferralOtp = useModalStore((s) => s.openReferralOtp)
  const closeReferralOtp = useModalStore((s) => s.closeReferralOtp)
  const resetReferralFlow = useModalStore((s) => s.resetReferralFlow)

  // Close every step and clear the deep-link data AppNavigator owns.
  const exitFlow = () => {
    resetReferralFlow()
    onExit()
  }

  return (
    <>
      {introOpen && (
        <View style={styles.overlay}>
          <ReferralScreen
            referrerUsername={referralCode}
            referrerName={referrerProfile?.name}
            referrerAvatarUrl={referrerProfile?.avatar_url}
            isDarkMode={isDarkMode}
            onClose={exitFlow}
            onRegister={openReferralSignup}
          />
        </View>
      )}

      {signupOpen && (
        <View style={styles.overlay}>
          <ReferralSignupScreen
            referrerUsername={referralCode}
            isDarkMode={isDarkMode}
            onBack={closeReferralSignup}
            onContinueToOtp={(phone: string, verificationToken: string) =>
              openReferralOtp({ phone, verificationToken })
            }
          />
        </View>
      )}

      {otpOpen && otpData && (
        <View style={styles.overlay}>
          <ReferralOtpScreen
            phone={otpData.phone}
            verificationToken={otpData.verificationToken}
            isDarkMode={isDarkMode}
            onBack={closeReferralOtp}
            onSuccess={() => {
              exitFlow()
              Toast.show({
                type: "success",
                text1: "Registration Complete",
                text2: "Welcome to AF Home!",
              })
            }}
          />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  // Mirrors AppNavigator's `cartScreenOverlay`.
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },
})
