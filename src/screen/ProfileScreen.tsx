// @ts-nocheck
import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Share,
  Clipboard,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import Toast from "react-native-toast-message"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { Colors } from "../constants/colors"
import { API_CONFIG } from "../config/api"
import PrimaryButton from "../components/Button/PrimaryButton"
import OutlineButton from "../components/Button/OutlineButton"
import { referralService, ReferralTree } from "../services/referralService"
import { getBadgeImageSource } from "../constants/tierConfig"
import { accountService } from "../services/accountService"
import { orderService } from "../services/orderService"
import LevelProgress from "../components/LevelProgress/LevelProgress"
// import DailyCheckin from "../components/DailyCheckin/DailyCheckin"
import ProfileDetailsScreen from "./ProfileDetailsScreen"
import LevelProgressDetailsScreen from "./LevelProgressDetailsScreen"
import { ChatBotIcon } from "../components/ChatBot"
import LeaderboardScreen from "./LeaderboardScreen"
import { styles } from "../styles/ProfileScreen.styles"

interface User {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  username?: string
  avatar_url?: string
  avatar_original_url?: string
  badge_name?: string
  badge_image?: string | any
  rank?: number
  badge?: number
  account_status?: number
  profile_complete?: boolean
  profile_completion_percentage?: number
  monthly_activation?: {
    current_month_pv?: number
    threshold_pv?: number
    remaining_pv?: number
  }
  [key: string]: any
}

interface ProfileScreenProps {
  user?: User | null
  onLogout?: () => void
  onNavigateSettings?: () => void
  onCartPress?: () => void
  cartCount?: number
  token?: string | null
  onShowProfileDetails?: (show: boolean) => void
  onShowReferralNetwork?: (tree: ReferralTree | null) => void
  isDarkMode?: boolean
  onPurchaseItemClick?: (
    status:
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "to_receive"
      | "delivered"
      | "cancelled"
      | "return"
  ) => void
  linkedAccountsRefreshTrigger?: number
  onSecuritySettingsPress?: () => void
  setShowLeaderboard?: (show: boolean) => void
  showLeaderboard?: boolean
  onShowAFWalletOverview?: () => void
  onShowAFWalletVoucher?: () => void
  onShowAFWalletRewards?: () => void
  onShowAFWalletNetwork?: () => void
  onShowPVEarner?: (show: boolean) => void
  showPVEarnerFromTab?: boolean
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onProductPress?: (id: number) => void
  onShopNavigate?: () => void
}

const REFERRAL_STATS = [
  { label: "Total", value: "5", icon: "people-outline" as const },
  { label: "Pending", value: "₱1,200", icon: "time-outline" as const },
  { label: "Earned", value: "₱4,500", icon: "cash-outline" as const },
]

const PURCHASE_ITEMS = [
  { icon: "time-outline" as const, label: "Pending", key: "pending" as const },
  { icon: "checkmark" as const, label: "Paid", key: "paid" as const },
  {
    icon: "hourglass-outline" as const,
    label: "Processing",
    key: "processing" as const,
  },
  { icon: "cube-outline" as const, label: "To Ship", key: "shipped" as const },
]

const PURCHASE_BOTTOM_ITEMS = [
  {
    icon: "car-outline" as const,
    label: "To Receive",
    key: "to_receive" as const,
  },
  {
    icon: "checkmark-circle-outline" as const,
    label: "Delivered",
    key: "delivered" as const,
  },
  {
    icon: "close-circle-outline" as const,
    label: "Cancelled",
    key: "cancelled" as const,
  },
  {
    icon: "return-down-back-outline" as const,
    label: "Return",
    key: "return" as const,
  },
]

const SOCIAL_ITEMS = [
  {
    icon: "logo-facebook" as const,
    label: "Facebook",
    url: "https://facebook.com/afhome.ph",
    color: "#1877F2",
  },
  {
    icon: "logo-instagram" as const,
    label: "Instagram",
    url: "https://instagram.com/afhome.ph",
    color: "#E4405F",
  },
  {
    icon: "logo-tiktok" as const,
    label: "TikTok",
    url: "https://tiktok.com/@afhome.ph",
    color: "#000000",
  },
  {
    icon: "globe-outline" as const,
    label: "Website",
    url: "https://www.afhome.ph",
    color: Colors.sky,
  },
]

const MENU_ITEMS = [
  {
    icon: "settings-outline" as const,
    label: "Settings",
    chevron: true,
    key: "settings",
  },
  {
    icon: "log-out-outline" as const,
    label: "Log Out",
    chevron: false,
    danger: true,
    key: "logout",
  },
]

export default function ProfileScreen({
  user,
  onLogout,
  onNavigateSettings,
  onCartPress,
  cartCount = 0,
  token,
  onShowProfileDetails,
  onShowReferralNetwork,
  isDarkMode = false,
  onPurchaseItemClick,
  linkedAccountsRefreshTrigger,
  onSecuritySettingsPress,
  setShowLeaderboard,
  showLeaderboard = false,
  onShowAFWalletOverview,
  onShowAFWalletVoucher,
  onShowAFWalletRewards,
  onShowAFWalletNetwork,
  onShowPVEarner,
  showPVEarnerFromTab = false,
  wishlistItems = [],
  onWishlistChange = () => {},
  onProductPress = () => {},
  onShopNavigate = () => {},
}: ProfileScreenProps) {
  console.log("[ProfileScreen] Component mounted/updated", {
    userEmail: user?.email,
    hasToken: !!token,
    linkedAccountsRefreshTrigger,
  })
  console.log("[ProfileScreen] User object received:", {
    name: user?.name,
    badge_name: user?.badge_name,
    badge_image: user?.badge_image,
    avatar_url: user?.avatar_url,
  })
  const insets = useSafeAreaInsets()

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
    cardBg: isDarkMode ? "#1e293b" : "#f8fafc",
    headerBg: isDarkMode ? "#1f2937" : Colors.white,
    socialIconBg: isDarkMode ? "#334155" : "#f8fafc",
    purchaseIconBg: isDarkMode ? "#334155" : "#f8fafc",
  }
  const [enlargedQR, setEnlargedQR] = useState<"signup" | "shopping" | null>(
    null
  )
  const [referralTree, setReferralTree] = useState<ReferralTree | null>(null)
  const [loadingReferral, setLoadingReferral] = useState(false)
  const [googleLinked, setGoogleLinked] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [loadingLoyalty, setLoadingLoyalty] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showLevelProgressDetails, setShowLevelProgressDetails] =
    useState(false)
  const [orderCounts, setOrderCounts] = useState<any>(null)
  const [showSecurityBanner, setShowSecurityBanner] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [dailyCheckinClaimed, setDailyCheckinClaimed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userLeaderboardRank, setUserLeaderboardRank] = useState<number | null>(
    null
  )
  const photoUrl = user?.avatar_url ?? null
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?"
  const firstName = user?.name?.split(" ")[0] ?? "User"
  const username = user?.username || "guest"
  const signupUrl = `https://afhome.ph/ref/${username}`
  const shoppingUrl = `https://afhome.ph/shop?ref=${username}`

  const handleCopy = (url: string) => {
    Clipboard.setString(url)
    Toast.show({
      type: "success",
      text1: "Link Copied",
      text2: "Referral link copied to clipboard",
    })
  }

  const handlePurchaseItemClick = (
    label: string,
    key:
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "to_receive"
      | "delivered"
      | "cancelled"
      | "return"
  ) => {
    onPurchaseItemClick?.(key)
  }

  const getPurchaseCount = (
    key:
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "to_receive"
      | "delivered"
      | "cancelled"
      | "return"
  ) => {
    if (!orderCounts) return 0
    const aliases: Record<string, string[]> = {
      pending: ["pending"],
      paid: ["paid"],
      processing: ["processing"],
      shipped: ["shipped", "to_ship", "toship"],
      to_receive: [
        "to_receive",
        "out_for_delivery",
        "outfordelivery",
        "toReceive",
      ],
      delivered: ["delivered"],
      cancelled: ["cancelled", "canceled"],
      return: ["return", "returned", "returns"],
    }

    for (const alias of aliases[key] || [key]) {
      const value = Number(orderCounts?.[alias])
      if (Number.isFinite(value) && value > 0) return value
    }

    return 0
  }

  useEffect(() => {
    onShowProfileDetails?.(showProfileDetails)
  }, [showProfileDetails, onShowProfileDetails])

  useEffect(() => {
    console.log("[ProfileScreen] useEffect token changed:", { token: !!token })
    if (token) {
      console.log("[ProfileScreen] Token available, fetching data")
      fetchLoyaltyData()
      fetchOrderCounts()
      fetchReferralTree()
      fetchLinkedAccounts()
      fetchSecuritySettings()
      fetchWalletData()
      fetchUserLeaderboardRank()
    }
  }, [token])

  const fetchUserLeaderboardRank = async () => {
    if (!token || !user?.id) return
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/public/top-members?sort=referrals&per_page=100`
      )
      const result = await response.json()
      const members = Array.isArray(result?.data) ? result.data : []
      const userRankIndex = members.findIndex(
        (member: any) => member.id === parseInt(user.id)
      )
      if (userRankIndex !== -1) {
        setUserLeaderboardRank(userRankIndex + 1)
      }
    } catch (error) {
      console.error("Error fetching user leaderboard rank:", error)
    }
  }

  useEffect(() => {
    console.log(
      "[ProfileScreen] linkedAccountsRefreshTrigger changed:",
      linkedAccountsRefreshTrigger
    )
    if (linkedAccountsRefreshTrigger && linkedAccountsRefreshTrigger > 0) {
      console.log(
        "[ProfileScreen] Trigger detected, refetching linked accounts"
      )
      fetchLinkedAccounts()
    }
  }, [linkedAccountsRefreshTrigger])

  const fetchReferralTree = async () => {
    if (!token) return
    try {
      const data = await referralService.getReferralTree(token)
      console.log("[ProfileScreen] fetchReferralTree - initial load:", {
        hasData: !!data,
        hasRoot: !!data?.root,
        totalNetwork: data?.summary?.total_network,
      })
      if (data && data.root) {
        setReferralTree(data)
      }
    } catch (error: any) {
      console.error(
        "[ProfileScreen] fetchReferralTree - error:",
        error?.message || error
      )
    }
  }

  const fetchLoyaltyData = async () => {
    if (!token) return
    setLoadingLoyalty(true)
    try {
      const snapshot = await accountService.getAccountSnapshot(token)
      setLoyaltyData(snapshot.loyalty)
    } catch (error: any) {
      console.error("Error fetching loyalty data:", error)
    } finally {
      setLoadingLoyalty(false)
    }
  }

  const fetchOrderCounts = async () => {
    if (!token) return
    try {
      const data = await orderService.getOrderCounts(token)
      console.log("[ProfileScreen] orderCounts payload:", JSON.stringify(data))
      setOrderCounts({
        ...data,
        to_receive: Number(
          data?.to_receive ??
            data?.out_for_delivery ??
            data?.outfordelivery ??
            data?.toReceive ??
            0
        ),
        delivered: Number(data?.delivered ?? 0),
        shipped: Number(data?.shipped ?? data?.to_ship ?? data?.toship ?? 0),
        cancelled: Number(data?.cancelled ?? data?.canceled ?? 0),
        return: Number(data?.return ?? data?.returned ?? data?.returns ?? 0),
      })
    } catch (error: any) {
      console.error("Error fetching order counts:", error)
    }
  }

  const fetchLinkedAccounts = async () => {
    if (!token) {
      console.log(
        "[ProfileScreen] No token available for fetching linked accounts"
      )
      return
    }

    try {
      console.log("[ProfileScreen] Fetching Google linked status from endpoint")
      const endpoint = `${require("../config/api").API_CONFIG.BASE_URL}/auth/mobile/check-google-linked`
      console.log("[ProfileScreen] Endpoint:", endpoint)

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[ProfileScreen] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[ProfileScreen] API Error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ProfileScreen] Full API response:", JSON.stringify(data))
      console.log("[ProfileScreen] data.linked:", data.linked)

      const isLinked = data.linked === true
      console.log("[ProfileScreen] Setting googleLinked to:", isLinked)
      setGoogleLinked(isLinked)
    } catch (error: any) {
      console.error("[ProfileScreen] Error fetching Google linked status:", {
        message: error.message,
        stack: error.stack,
      })
    }
  }

  const fetchSecuritySettings = async () => {
    if (!token) return
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(
        `${API_CONFIG.BASE_URL}/user/security-settings`,
        { headers }
      )
      const securityData = res?.data?.data
      setBiometricEnabled(securityData?.biometric_enabled ?? false)
    } catch (error) {
      console.log("Error fetching security settings:", error)
    }
  }

  const fetchWalletData = async () => {
    if (!token) return
    setLoadingWallet(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(
        `${API_CONFIG.BASE_URL}/encashment/wallet?wallet_type=all`,
        { headers }
      )
      const walletSummary = res?.data?.data?.summary || res?.data?.summary
      setWalletData(walletSummary)
      console.log("[ProfileScreen] Wallet data fetched:", walletSummary)
    } catch (error) {
      console.log("Error fetching wallet data:", error)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleRefresh = async () => {
    if (!token || refreshing) return

    setRefreshing(true)
    try {
      await Promise.all([fetchOrderCounts(), fetchReferralTree()])
    } finally {
      setRefreshing(false)
    }
  }

  const handleViewNetwork = async () => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Missing authentication token",
      })
      return
    }

    setLoadingReferral(true)
    try {
      const data = await referralService.getReferralTree(token)
      console.log("[ProfileScreen] handleViewNetwork - data fetched:", {
        hasData: !!data,
        hasRoot: !!data?.root,
        rootId: data?.root?.id,
        totalNetwork: data?.summary?.total_network,
      })

      if (!data || !data.root) {
        console.warn(
          "[ProfileScreen] Invalid referral tree data - missing root:",
          data
        )
        throw new Error("Unable to load referral network. Please try again.")
      }

      setReferralTree(data)
      onShowReferralNetwork?.(data)
    } catch (error: any) {
      console.error("[ProfileScreen] handleViewNetwork - error:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load referral network",
      })
    } finally {
      setLoadingReferral(false)
    }
  }

  const handleShare = async (url: string, type?: "signup" | "shopping") => {
    try {
      let message = `Check out AF Home! ${url}`
      if (type === "signup") {
        message = `Join me as an AF Home member and start earning rewards! Register here: ${url}`
      } else if (type === "shopping") {
        message = `Shop with me on AF Home and enjoy amazing products! Use my link: ${url}`
      }
      await Share.share({
        message: message,
        url: url,
      })
    } catch (error) {
      console.log("Error sharing:", error)
    }
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {/* ── Header with Background Image ── */}
        <View
          style={[
            styles.headerBackground,
            { borderBottomColor: colors.border },
          ]}
        >
          <Image
            source={require("../../assets/profile_bg.png")}
            style={styles.headerBackgroundImage}
            resizeMode="cover"
          />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.headerLeft}
              onPress={() => setShowProfileDetails(true)}
              activeOpacity={0.7}
            >
              <View style={styles.headerAvatar}>
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.headerAvatarImg}
                  />
                ) : (
                  <Text style={styles.headerAvatarInitial}>{initial}</Text>
                )}
              </View>
              <View style={styles.headerNameContainer}>
                <View style={styles.headerNameRow}>
                  <Text
                    style={[styles.headerName, { color: Colors.white }]}
                    numberOfLines={1}
                  >
                    {user?.name ?? "Guest"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={Colors.white}
                    style={styles.profileIcon}
                  />
                </View>
                {user?.username && (
                  <View style={styles.usernameRow}>
                    <Text
                      style={[styles.usernameText, { color: Colors.white }]}
                    >
                      @{user.username}
                    </Text>
                    {user?.badge_name && (
                      <>
                        <View style={styles.usernameDot} />
                        <View style={styles.userBadge}>
                          <Ionicons
                            name="shield-checkmark"
                            size={10}
                            color={Colors.white}
                          />
                          <Text style={styles.userBadgeText}>
                            {user.badge_name}
                          </Text>
                        </View>
                      </>
                    )}
                    <View style={styles.usernameDot} />
                    <Text
                      style={[styles.usernamePvText, { color: Colors.white }]}
                    >
                      {user.monthly_activation?.remaining_pv ?? 0} PV
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={onCartPress}
              >
                <Ionicons name="cart-outline" size={20} color={Colors.white} />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={onNavigateSettings}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.sky]}
              tintColor={Colors.sky}
            />
          }
        >
          {/* Security Settings Banner */}
          {showSecurityBanner && (!biometricEnabled || !googleLinked) && (
            <View
              style={[
                styles.securityBannerNew,
                {
                  backgroundColor: isDarkMode ? "#1e3a8a" : "#dbeafe",
                  borderColor: Colors.sky,
                },
              ]}
            >
              {/* Close Button */}
              <TouchableOpacity
                style={styles.securityBannerCloseNew}
                onPress={() => setShowSecurityBanner(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={Colors.sky} />
              </TouchableOpacity>

              {/* Main Content */}
              <View style={styles.securityBannerMainContent}>
                <View style={styles.securityBannerIconTitleWrap}>
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={Colors.sky}
                  />
                  <Text
                    style={[
                      styles.securityBannerTitleNew,
                      { color: isDarkMode ? "#e0e7ff" : "#1e40af" },
                    ]}
                  >
                    Secure Your Account
                  </Text>
                </View>
                <Text
                  style={[
                    styles.securityBannerSubtitleNew,
                    { color: isDarkMode ? "#bfdbfe" : "#1e3a8a" },
                  ]}
                >
                  Add biometric or link Google for faster login
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.securityBannerActionBtn,
                  { backgroundColor: Colors.sky },
                ]}
                onPress={onSecuritySettingsPress}
                activeOpacity={0.7}
              >
                <Text style={styles.securityBannerActionBtnText}>Setup</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PV Overview Section */}
          {loyaltyData && (
            <View
              style={[
                styles.pvOverviewSection,
                {
                  backgroundColor: colors.containerBg,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Top Stats */}
              <View style={styles.pvStatsRow}>
                <View style={styles.pvStatItem}>
                  <Text style={[styles.pvStatLabel, { color: colors.textSec }]}>
                    Total PV
                  </Text>
                  <Text style={[styles.pvStatValue, { color: Colors.sky }]}>
                    {user?.monthly_activation?.remaining_pv ?? 0}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pvStatDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.pvStatItem}>
                  <Text style={[styles.pvStatLabel, { color: colors.textSec }]}>
                    Earnings
                  </Text>
                  <Text style={[styles.pvStatValue, { color: Colors.sky }]}>
                    ₱{loyaltyData.earnings || 0}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pvStatDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <TouchableOpacity
                  style={styles.pvStatItem}
                  onPress={() => setShowLeaderboard?.(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pvStatLabel, { color: colors.textSec }]}>
                    Leaderboard
                  </Text>
                  <View style={styles.leaderboardRankDisplay}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={[styles.pvStatValue, { color: Colors.sky }]}>
                      #{userLeaderboardRank ?? "-"}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View
                  style={[
                    styles.pvStatDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <TouchableOpacity
                  style={styles.pvStatItem}
                  onPress={() => onShowReferralNetwork?.(referralTree)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pvStatLabel, { color: colors.textSec }]}>
                    Referrals
                  </Text>
                  <View style={styles.referralsDisplay}>
                    <Ionicons name="people" size={16} color={Colors.sky} />
                    <Text style={[styles.pvStatValue, { color: Colors.sky }]}>
                      {loyaltyData?.referral_count || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Daily Check-In Button */}
              <TouchableOpacity
                style={[
                  styles.dailyCheckinBtn,
                  { borderTopColor: colors.borderLight },
                ]}
                onPress={() => {
                  onShowPVEarner?.(true)
                }}
                activeOpacity={0.8}
              >
                <View style={styles.dailyCheckinBtnLeft}>
                  <View style={styles.dailyCheckinIconContainer}>
                    <Image
                      source={{
                        uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_1_kpacst.png",
                      }}
                      style={styles.dailyCheckinIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[styles.dailyCheckinBtnText, { color: colors.text }]}
                  >
                    Daily Check-In
                  </Text>
                </View>
                {!dailyCheckinClaimed && (
                  <View style={styles.dailyCheckinClaimContainer}>
                    <View style={styles.dailyCheckinDotContainer}>
                      <View style={styles.dailyCheckinDotGlow} />
                      <View style={styles.dailyCheckinRedDot} />
                    </View>
                    <Text
                      style={[
                        styles.dailyCheckinClaimText,
                        { color: Colors.sky },
                      ]}
                    >
                      Claim +20 PV!
                    </Text>
                  </View>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSec}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Level Progress */}
          {loyaltyData && (
            <LevelProgress
              currentTier={loyaltyData.tier}
              currentRank={loyaltyData.rank}
              personalPv={loyaltyData.personal_pv}
              referralCount={loyaltyData.referral_count}
              activeMembers={loyaltyData.active_members_count}
              activeBuilders={loyaltyData.active_builders_count}
              activeLeaders={loyaltyData.active_leaders_count}
              username={user?.username}
              loading={loadingLoyalty}
              isDarkMode={isDarkMode}
              onViewDetails={() => {
                setShowLevelProgressDetails(true)
              }}
            />
          )}

          {/* My Purchases */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.purchasesHeader,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() =>
                handlePurchaseItemClick("View Purchase History", "pending")
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                My Purchases
              </Text>
              <TouchableOpacity
                style={styles.purchasesViewAll}
                onPress={() =>
                  handlePurchaseItemClick("View Purchase History", "delivered")
                }
              >
                <View style={styles.purchasesViewAllContainer}>
                  <Text
                    style={[
                      styles.purchasesViewAllText,
                      { color: colors.textSec },
                    ]}
                  >
                    View Purchase History
                  </Text>
                  {orderCounts?.delivered !== undefined && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {orderCounts.delivered}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.purchasesWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.purchasesGrid}
                scrollEnabled={true}
              >
                {PURCHASE_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.purchaseItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      handlePurchaseItemClick(item.label, item.key)
                    }
                  >
                    <View
                      style={[
                        styles.purchaseIconContainer,
                        { backgroundColor: colors.purchaseIconBg },
                      ]}
                    >
                      <Ionicons name={item.icon} size={24} color={Colors.sky} />
                      {item.key && getPurchaseCount(item.key) > 0 && (
                        <View
                          style={[
                            styles.itemCountBadge,
                            {
                              borderColor: isDarkMode
                                ? colors.containerBg
                                : Colors.white,
                            },
                          ]}
                        >
                          <Text style={styles.itemCountBadgeText}>
                            {getPurchaseCount(item.key) > 99
                              ? "99+"
                              : getPurchaseCount(item.key)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.purchaseLabel, { color: colors.text }]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.bottomPurchaseRow}>
                {PURCHASE_BOTTOM_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.purchaseItemBottom}
                    activeOpacity={0.7}
                    onPress={() =>
                      handlePurchaseItemClick(item.label, item.key)
                    }
                  >
                    <View
                      style={[
                        styles.purchaseIconContainer,
                        { backgroundColor: colors.purchaseIconBg },
                      ]}
                    >
                      <Ionicons name={item.icon} size={24} color={Colors.sky} />
                      {item.key && getPurchaseCount(item.key) > 0 && (
                        <View
                          style={[
                            styles.itemCountBadge,
                            {
                              borderColor: isDarkMode
                                ? colors.containerBg
                                : Colors.white,
                            },
                          ]}
                        >
                          <Text style={styles.itemCountBadgeText}>
                            {getPurchaseCount(item.key) > 99
                              ? "99+"
                              : getPurchaseCount(item.key)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.purchaseLabel, { color: colors.text }]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* My Referrals */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.purchasesHeader,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={handleViewNetwork}
              disabled={loadingReferral}
              activeOpacity={0.7}
            >
              <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                My Referrals
              </Text>
              <TouchableOpacity
                style={styles.purchasesViewAll}
                onPress={handleViewNetwork}
                disabled={loadingReferral}
              >
                {loadingReferral ? (
                  <ActivityIndicator size="small" color={colors.textSec} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.purchasesViewAllText,
                        { color: colors.textSec },
                      ]}
                    >
                      View Network
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.textSec}
                    />
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.referralsGrid}>
              {referralTree ? (
                <>
                  <TouchableOpacity
                    style={styles.referralItem}
                    activeOpacity={0.7}
                    onPress={handleViewNetwork}
                  >
                    <View
                      style={[
                        styles.referralIconContainer,
                        { backgroundColor: "#e0f2fe" },
                      ]}
                    >
                      <Ionicons
                        name="people-outline"
                        size={28}
                        color={Colors.sky}
                      />
                    </View>
                    <Text
                      style={[styles.referralItemValue, { color: colors.text }]}
                    >
                      {referralTree.summary.total_network}
                    </Text>
                    <Text
                      style={[
                        styles.referralItemLabel,
                        { color: colors.textSec },
                      ]}
                    >
                      Total
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.referralItem}
                    activeOpacity={0.7}
                    onPress={handleViewNetwork}
                  >
                    <View
                      style={[
                        styles.referralIconContainer,
                        { backgroundColor: "#fef3c7" },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={28}
                        color="#f59e0b"
                      />
                    </View>
                    <Text
                      style={[styles.referralItemValue, { color: colors.text }]}
                    >
                      {referralTree.summary.direct_count}
                    </Text>
                    <Text
                      style={[
                        styles.referralItemLabel,
                        { color: colors.textSec },
                      ]}
                    >
                      Direct
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.referralItem}
                    activeOpacity={0.7}
                    onPress={handleViewNetwork}
                  >
                    <View
                      style={[
                        styles.referralIconContainer,
                        { backgroundColor: "#fed7aa" },
                      ]}
                    >
                      <Ionicons name="cash-outline" size={28} color="#f97316" />
                    </View>
                    <Text
                      style={[styles.referralItemValue, { color: colors.text }]}
                    >
                      ₱{referralTree.root.total_earnings}
                    </Text>
                    <Text
                      style={[
                        styles.referralItemLabel,
                        { color: colors.textSec },
                      ]}
                    >
                      Earned
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <ActivityIndicator size="large" color={Colors.sky} />
              )}
            </View>
          </View>

          {/* Affiliate Referral QR */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.purchasesHeader,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View>
                <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                  Affiliate Referral QR
                </Text>
                <Text style={[styles.qrSubtitle, { color: Colors.sky }]}>
                  Ready to Share
                </Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              {/* Signup QR Section */}
              <View
                style={[
                  styles.qrCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.qrCardHeader}>
                  <View
                    style={[
                      styles.qrIconBox,
                      { backgroundColor: isDarkMode ? "#0c2340" : "#e0f2fe" },
                    ]}
                  >
                    <Ionicons name="person-add" size={16} color={Colors.sky} />
                  </View>
                  <Text style={[styles.qrCardTitle, { color: colors.text }]}>
                    Invite Members
                  </Text>
                </View>
                <Text
                  style={[styles.qrCardDescription, { color: colors.textSec }]}
                >
                  Use this link when someone wants to register as your referral.
                </Text>

                <Text style={[styles.qrTopLabel, { color: Colors.sky }]}>
                  Signup referral QR code
                </Text>

                <View style={styles.qrMain}>
                  <TouchableOpacity
                    style={[
                      styles.qrImageWrapper,
                      {
                        backgroundColor: colors.containerBg,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setEnlargedQR("signup")}
                  >
                    <Image
                      source={{
                        uri: `https://quickchart.io/qr?text=${encodeURIComponent(signupUrl)}&size=200`,
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <View style={styles.qrImageTag}>
                      <Text style={styles.qrImageTagText}>Signup</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.qrInfo}>
                    <Text style={[styles.qrLabel, { color: colors.textSec }]}>
                      Member signup link
                    </Text>
                    <View
                      style={[
                        styles.qrLinkBox,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.qrLinkText, { color: Colors.sky }]}
                        numberOfLines={2}
                      >
                        {signupUrl}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.qrActions}>
                  <PrimaryButton
                    title="Share"
                    icon="share-social"
                    onPress={() => handleShare(signupUrl, "signup")}
                    size="small"
                    style={{ flex: 1 }}
                  />
                  <OutlineButton
                    title="Copy Link"
                    icon="copy-outline"
                    onPress={() => handleCopy(signupUrl)}
                    color={Colors.sky}
                    size="small"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              <View
                style={[styles.qrSeparator, { backgroundColor: colors.border }]}
              />

              {/* Shopping QR Section */}
              <View
                style={[
                  styles.qrCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.qrCardHeader}>
                  <View
                    style={[styles.qrIconBox, { backgroundColor: "#fed7aa" }]}
                  >
                    <Ionicons name="cart" size={16} color="#f97316" />
                  </View>
                  <Text style={[styles.qrCardTitle, { color: colors.text }]}>
                    Share Shopping Link
                  </Text>
                </View>
                <Text
                  style={[styles.qrCardDescription, { color: colors.textSec }]}
                >
                  Use this link for non-members who only want to shop. Their
                  checkout will carry your referral automatically.
                </Text>

                <Text style={[styles.qrTopLabel, { color: "#f97316" }]}>
                  Shopping referral QR code
                </Text>

                <View style={styles.qrMain}>
                  <TouchableOpacity
                    style={[
                      styles.qrImageWrapper,
                      {
                        backgroundColor: colors.containerBg,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setEnlargedQR("shopping")}
                  >
                    <Image
                      source={{
                        uri: `https://quickchart.io/qr?text=${encodeURIComponent(shoppingUrl)}&size=200`,
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <View
                      style={[
                        styles.qrImageTag,
                        { backgroundColor: "#f97316" },
                      ]}
                    >
                      <Text style={styles.qrImageTagText}>Shopping</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.qrInfo}>
                    <Text style={[styles.qrLabel, { color: colors.textSec }]}>
                      Shopping referral link
                    </Text>
                    <View
                      style={[
                        styles.qrLinkBox,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.qrLinkText, { color: Colors.sky }]}
                        numberOfLines={2}
                      >
                        {shoppingUrl}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.qrActions}>
                  <PrimaryButton
                    title="Share"
                    icon="share-social"
                    onPress={() => handleShare(shoppingUrl, "shopping")}
                    size="small"
                    style={{ backgroundColor: "#f97316", flex: 1 }}
                  />
                  <OutlineButton
                    title="Copy Link"
                    icon="copy-outline"
                    onPress={() => handleCopy(shoppingUrl)}
                    color="#f97316"
                    size="small"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* AF Wallet Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.purchasesHeader,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                AF Wallet
              </Text>
            </View>

            {loadingWallet ? (
              <ActivityIndicator
                size="large"
                color={Colors.sky}
                style={{ paddingVertical: 20 }}
              />
            ) : walletData ? (
              <View style={styles.walletCardsContainer}>
                {/* Overview Card */}
                <TouchableOpacity
                  style={[
                    styles.walletCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onShowAFWalletOverview?.()}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardTitle}>
                    <Ionicons
                      name="wallet-outline"
                      size={18}
                      color={Colors.sky}
                    />
                    <Text
                      style={[
                        styles.walletCardTitleText,
                        { color: colors.text },
                      ]}
                    >
                      Overview
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSec}
                  />
                </TouchableOpacity>

                {/* AF Voucher Card */}
                <TouchableOpacity
                  style={[
                    styles.walletCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      marginTop: 12,
                    },
                  ]}
                  onPress={() => onShowAFWalletVoucher?.()}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardTitle}>
                    <Ionicons name="ticket-outline" size={18} color="#f97316" />
                    <Text
                      style={[
                        styles.walletCardTitleText,
                        { color: colors.text },
                      ]}
                    >
                      AF Voucher
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSec}
                  />
                </TouchableOpacity>

                {/* Rewards Card */}
                <TouchableOpacity
                  style={[
                    styles.walletCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      marginTop: 12,
                    },
                  ]}
                  onPress={() => onShowAFWalletRewards?.()}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardTitle}>
                    <Image
                      source={{
                        uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_1_kpacst.png",
                      }}
                      style={styles.walletCardIcon}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.walletCardTitleText,
                        { color: colors.text },
                      ]}
                    >
                      Rewards & Cashback
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSec}
                  />
                </TouchableOpacity>

                {/* Network Earnings Card */}
                <TouchableOpacity
                  style={[
                    styles.walletCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      marginTop: 12,
                    },
                  ]}
                  onPress={() => onShowAFWalletNetwork?.()}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletCardTitle}>
                    <Ionicons
                      name="git-network-outline"
                      size={18}
                      color="#8b5cf6"
                    />
                    <Text
                      style={[
                        styles.walletCardTitleText,
                        { color: colors.text },
                      ]}
                    >
                      Network Earnings
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSec}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Menu */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuRow,
                  index < MENU_ITEMS.length - 1 && [
                    styles.menuRowBorder,
                    { borderBottomColor: colors.borderLight },
                  ],
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.key === "logout") onLogout?.()
                  if (item.key === "settings") onNavigateSettings?.()
                }}
              >
                <View
                  style={[
                    styles.menuIcon,
                    item.danger && styles.menuIconDanger,
                    {
                      backgroundColor: isDarkMode
                        ? item.danger
                          ? "#7f1d1d"
                          : "#0c2340"
                        : item.danger
                          ? "#fee2e2"
                          : "#e0f2fe",
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.danger ? Colors.error : Colors.sky}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.danger && styles.menuLabelDanger,
                    { color: item.danger ? Colors.error : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
                {item.chevron && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSec}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Connect with Us */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.purchasesHeader,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                Connect with Us
              </Text>
            </View>
            <View style={styles.purchasesGrid}>
              {SOCIAL_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.purchaseItem}
                  activeOpacity={0.7}
                  onPress={() => item.url && Linking.openURL(item.url)}
                >
                  <View
                    style={[
                      styles.purchaseIconContainer,
                      { backgroundColor: colors.socialIconBg },
                    ]}
                  >
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={[styles.purchaseLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Enlarged QR Modal */}
        <Modal
          visible={enlargedQR !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEnlargedQR(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.containerBg },
              ]}
            >
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEnlargedQR(null)}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>

              <Image
                source={{
                  uri:
                    enlargedQR === "signup"
                      ? `https://quickchart.io/qr?text=${encodeURIComponent(signupUrl)}&size=400`
                      : `https://quickchart.io/qr?text=${encodeURIComponent(shoppingUrl)}&size=400`,
                }}
                style={styles.modalQrImage}
                resizeMode="contain"
              />

              <Text style={[styles.modalQrUrl, { color: colors.textSec }]}>
                {enlargedQR === "signup" ? signupUrl : shoppingUrl}
              </Text>

              <PrimaryButton
                title={
                  enlargedQR === "signup"
                    ? "Share Signup Link"
                    : "Share Shopping Link"
                }
                icon="share-social"
                onPress={() => {
                  const url = enlargedQR === "signup" ? signupUrl : shoppingUrl
                  handleShare(url, enlargedQR)
                }}
                style={{ marginTop: 20, width: "80%" }}
              />
            </View>
          </View>
        </Modal>

        {/* Profile Details Screen */}
        {showProfileDetails && (
          <View style={styles.profileDetailsOverlay}>
            <ProfileDetailsScreen
              token={token}
              cartCount={cartCount}
              onClose={() => setShowProfileDetails(false)}
              onCartPress={onCartPress}
            />
          </View>
        )}
        {showLevelProgressDetails && loyaltyData && (
          <View style={styles.profileDetailsOverlay}>
            <LevelProgressDetailsScreen
              currentRank={loyaltyData.rank}
              personalPv={loyaltyData.personal_pv}
              referralCount={loyaltyData.referral_count}
              activeMembers={loyaltyData.active_members_count}
              activeBuilders={loyaltyData.active_builders_count}
              activeLeaders={loyaltyData.active_leaders_count}
              isDarkMode={isDarkMode}
              onBack={() => setShowLevelProgressDetails(false)}
            />
          </View>
        )}

        {showLeaderboard && (
          <View style={styles.profileDetailsOverlay}>
            <LeaderboardScreen
              isDarkMode={isDarkMode}
              onClose={() => setShowLeaderboard(false)}
            />
          </View>
        )}
      </View>

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}
