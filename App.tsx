// @ts-nocheck
import React, { useState, useEffect } from "react"
import { View, LogBox, Linking, Modal } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"

// Suppress the "Text strings must be rendered within a <Text> component" error
LogBox.ignoreLogs(["Text strings must be rendered within a <Text> component"])
import Toast from "react-native-toast-message"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import IndexScreen from "./src/screen/IndexScreen"
import LoginScreen from "./src/screen/LoginScreen"
import SignupScreen from "./src/screen/SignupScreen"
import OtpScreen from "./src/screen/OtpScreen"
import AppNavigator from "./src/navigation/AppNavigator"
import OnboardingScreen from "./src/screen/OnboardingScreen"
import { storageService, StoredUser } from "./src/services/storageService"
import LoadingScreen from "./src/screen/LoadingScreen"
import { useFirebaseMessaging } from "./src/hooks/useFirebaseMessaging"
import { useAppUpdates } from "./src/hooks/useAppUpdates"
import ReferralScreen from "./src/screen/ReferralScreen"
import ReferralSignupScreen from "./src/screen/ReferralSignupScreen"
import ReferralOtpScreen from "./src/screen/ReferralOtpScreen"
import AFHomeAffiliateScreen from "./src/screen/AFHomeAffiliateScreen"
import { referralService } from "./src/services/referralService"
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans"
import { setupGlobalFont } from "./src/utils/fonts"

// Apply Plus Jakarta Sans as the default font for all Text/TextInput
setupGlobalFont()

type AuthScreen =
  | "index"
  | "login"
  | "signup"
  | "otp"
  | "referral-signup"
  | "referral-otp"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
})

interface AuthUser {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  username?: string
  avatar_url?: string
  avatar_original_url?: string
  phone?: string
  address?: string
  barangay?: string
  city?: string
  province?: string
  region?: string
  country?: string
  middle_name?: string
  birth_date?: string
  gender?: string
  occupation?: string
  rank?: number
  badge?: number
  badge_name?: string
  account_status?: number
  lock_status?: number
  verification_status?: string
  profile_complete?: boolean
  profile_completion_percentage?: number
  email_verified?: boolean
  password_change_required?: boolean
  two_factor_enabled?: boolean
  totp_enabled?: boolean
  referrer_id?: number
  referrer_username?: string
  referrer_name?: string
  monthly_activation?: {
    current_month_pv: number
    threshold_pv: number
    remaining_pv: number
  }
  [key: string]: any
}

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>("index")
  const [otpEmail, setOtpEmail] = useState("")
  const [verificationToken, setVerificationToken] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [referralCodeFromDeepLink, setReferralCodeFromDeepLink] = useState<
    string | null
  >(null)
  const [referrerProfileData, setReferrerProfileData] = useState<any>(null)
  const [showReferralScreenModal, setShowReferralScreenModal] = useState(false)
  const [referralOtpEmail, setReferralOtpEmail] = useState("")
  const [referralOtpToken, setReferralOtpToken] = useState("")
  const [showAffiliateScreen, setShowAffiliateScreen] = useState(false)
  const [productSlugFromDeepLink, setProductSlugFromDeepLink] = useState<
    string | null
  >(null)

  // Load Plus Jakarta Sans font variants (embedded at build time)
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  // Initialize FCM and register device when authenticated
  useFirebaseMessaging(authToken, authUser?.id || null)

  // Check for OTA updates
  useAppUpdates()

  useEffect(() => {
    checkStoredAuth()
  }, [])

  // Handle referral and product deep links at app level (works in unauthenticated flow)
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log("[App] Deep link received:", url)
      if (url.includes("/ref/")) {
        console.log("[App] Referral deep link detected:", url)
        const username = url.split("/ref/")[1]?.split("?")[0] || ""
        if (username) {
          setReferralCodeFromDeepLink(username)
          setShowReferralScreenModal(true)
          // Fetch referrer's public profile
          try {
            const profile = await referralService.getPublicProfile(username)
            setReferrerProfileData(profile)
          } catch (error: any) {
            console.error("[App] Failed to fetch referrer profile:", error)
          }
        }
      } else if (url.includes("/product/")) {
        console.log("[App] Product deep link detected:", url)
        const productSlug = url.split("/product/")[1]?.split("?")[0] || ""
        if (productSlug) {
          console.log("[App] Product slug from deep link:", productSlug)
          setProductSlugFromDeepLink(productSlug)
        }
      }
    }

    const subscription = Linking.addEventListener("url", handleDeepLink)

    // Check if app was launched from deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        console.log("[App] Initial deep link:", url)
        handleDeepLink({ url })
      }
    })

    return () => subscription.remove()
  }, [])

  async function checkStoredAuth() {
    try {
      const [isAuth, onboarded] = await Promise.all([
        storageService.isAuthenticated(),
        storageService.hasOnboarded(),
      ])
      setHasOnboarded(onboarded)
      if (isAuth) {
        const token = await storageService.getToken()
        const user = await storageService.getUser()
        if (token && user) {
          setAuthToken(token)
          setAuthUser(user)
          setAuthenticated(true)
        }
      }
    } catch (error) {
      console.error("Error checking stored auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOnboardingDone() {
    await storageService.setOnboarded()
    setHasOnboarded(true)
  }

  async function resetOnboarding() {
    await storageService.resetOnboarding()
    setHasOnboarded(false)
  }

  async function goAuthenticated(user?: AuthUser, token?: string) {
    // Save authentication data to storage for persistence
    if (user && token) {
      try {
        await storageService.saveAuthData(token, user)
      } catch (error) {
        console.error("Error saving auth data:", error)
      }
    }

    if (user) setAuthUser(user)
    if (token) setAuthToken(token)
    setScreen("index")

    // Clear referral state after authentication
    setReferralCodeFromDeepLink(null)
    setReferrerProfileData(null)
    setShowReferralScreenModal(false)
    setReferralOtpEmail("")
    setReferralOtpToken("")
    setAuthenticated(true)
  }

  async function logout() {
    try {
      await storageService.clearAuthData()
      setAuthenticated(false)
      setAuthUser(null)
      setAuthToken(null)
      setScreen("index")

      // Clear referral state on logout
      setReferralCodeFromDeepLink(null)
      setReferrerProfileData(null)
      setShowReferralScreenModal(false)
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  function renderAuth() {
    if (screen === "index") {
      return (
        <IndexScreen
          onGoToLogin={() => setScreen("login")}
          onGoToSignup={() => setScreen("referral-signup")}
          onAuthenticated={(user, token) => goAuthenticated(user, token)}
          onShowAffiliateScreen={() => setShowAffiliateScreen(true)}
        />
      )
    }

    if (screen === "signup") {
      return (
        <SignupScreen
          onGoToLogin={() => setScreen("login")}
          onGoToIndex={() => setScreen("index")}
          onContinueToOtp={(email, token) => {
            setOtpEmail(email)
            setVerificationToken(token)
            setScreen("otp")
          }}
        />
      )
    }

    if (screen === "referral-signup") {
      return (
        <ReferralSignupScreen
          referrerUsername={referralCodeFromDeepLink || ""}
          isDarkMode={false}
          pendingOtpEmail={referralOtpEmail}
          pendingOtpToken={referralOtpToken}
          onBack={() => {
            setReferralOtpEmail("")
            setReferralOtpToken("")
            setScreen("index")
          }}
          onContinueToOtp={(email, token) => {
            setReferralOtpEmail(email)
            setReferralOtpToken(token)
            setScreen("referral-otp")
          }}
          onResumOtp={() => setScreen("referral-otp")}
        />
      )
    }

    if (screen === "referral-otp") {
      return (
        <ReferralOtpScreen
          email={referralOtpEmail}
          verificationToken={referralOtpToken}
          isDarkMode={false}
          onBack={() => setScreen("referral-signup")}
          onSuccess={() => {
            setReferralOtpEmail("")
            setReferralOtpToken("")
            setScreen("index")
            // TODO: Auto-login user after OTP verification
          }}
        />
      )
    }

    if (screen === "otp") {
      return (
        <OtpScreen
          email={otpEmail}
          verificationToken={verificationToken}
          onBackToSignup={() => setScreen("signup")}
          onSuccess={goAuthenticated}
        />
      )
    }

    return (
      <LoginScreen
        onGoToSignup={() => setScreen("referral-signup")}
        onGoToIndex={() => setScreen("index")}
        onAuthenticated={(user, token) => goAuthenticated(user, token)}
        onResetOnboarding={resetOnboarding}
      />
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {isLoading || !fontsLoaded ? (
          <LoadingScreen />
        ) : !hasOnboarded ? (
          <OnboardingScreen onDone={handleOnboardingDone} />
        ) : authenticated ? (
          <NavigationContainer>
            <AppNavigator
              user={authUser}
              token={authToken}
              onLogout={logout}
              productSlugFromDeepLink={productSlugFromDeepLink}
              onProductDeepLinkHandled={() => setProductSlugFromDeepLink(null)}
            />
          </NavigationContainer>
        ) : (
          <>
            {renderAuth()}
            {showAffiliateScreen && (
              <Modal
                visible={showAffiliateScreen}
                transparent
                animationType="slide"
              >
                <AFHomeAffiliateScreen
                  onClose={() => setShowAffiliateScreen(false)}
                />
              </Modal>
            )}
            {showReferralScreenModal && referralCodeFromDeepLink && (
              <Modal
                visible={showReferralScreenModal}
                transparent
                animationType="slide"
              >
                <View
                  style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                >
                  <ReferralScreen
                    referrerUsername={referralCodeFromDeepLink}
                    referrerName={referrerProfileData?.name}
                    referrerAvatarUrl={referrerProfileData?.avatar_url}
                    isDarkMode={false}
                    onClose={() => {
                      setShowReferralScreenModal(false)
                      setReferralCodeFromDeepLink(null)
                      setReferrerProfileData(null)
                    }}
                    onRegister={() => {
                      setShowReferralScreenModal(false)
                      setScreen("referral-signup")
                    }}
                  />
                </View>
              </Modal>
            )}
          </>
        )}
        <Toast />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
