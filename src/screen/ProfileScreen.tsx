import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Clipboard,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Image } from "expo-image"
import Toast from "react-native-toast-message"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { Colors } from "../constants/colors"
import { getColors, gradients } from "../theme/theme"
import PrimaryButton from "../components/Button/PrimaryButton"
import OutlineButton from "../components/Button/OutlineButton"
import { referralService, ReferralTree } from "../services/referralService"
import { useWallet } from "../hooks/query/useWallet"
import {
  useLoyaltyData,
  useOrderCounts,
  useReferralTree,
  useSecuritySettings,
  useGoogleLinked,
  useUserLeaderboardRank,
  useProfileScreenInvalidate,
} from "../hooks/query/useProfileScreenData"
import LevelProgress from "../components/LevelProgress/LevelProgress"
// import DailyCheckin from "../components/DailyCheckin/DailyCheckin"
import LevelProgressDetailsScreen from "./LevelProgressDetailsScreen"
import { ChatBotIcon } from "../components/ChatBot"
import LeaderboardScreen from "./LeaderboardScreen"
import WebViewModal from "../components/WebViewModal/WebViewModal"
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
  onNavigateWishlist?: () => void
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
    icon: "cube-outline" as const,
    label: "Track My Order",
    chevron: true,
    key: "track",
  },
  {
    icon: "heart-outline" as const,
    label: "My Wishlist",
    chevron: true,
    key: "wishlist",
  },
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
  onNavigateWishlist = () => {},
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

  // Palette sourced from the centralized theme (slate spine + sky accent),
  // matching the website. Same keys the render already uses.
  const t = getColors(isDarkMode)
  const colors = {
    bg: t.bgSubtle,
    containerBg: t.card,
    text: t.text,
    textSec: t.textSecondary,
    border: t.border,
    borderLight: t.divider,
    cardBg: isDarkMode ? t.surface : t.bgSubtle,
    headerBg: t.card,
    socialIconBg: t.primarySoft,
    purchaseIconBg: t.primarySoft,
  }
  const [enlargedQR, setEnlargedQR] = useState<"signup" | "shopping" | null>(
    null
  )
  const [loadingReferral, setLoadingReferral] = useState(false)
  const [showLevelProgressDetails, setShowLevelProgressDetails] =
    useState(false)
  const [showSecurityBanner, setShowSecurityBanner] = useState(true)
  const [dailyCheckinClaimed, setDailyCheckinClaimed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showTrackOrder, setShowTrackOrder] = useState(false)

  // ── Server state via React Query ──
  const { data: loyaltyData = null, isLoading: loadingLoyalty } =
    useLoyaltyData({ token })
  const { data: orderCounts = null } = useOrderCounts({ token })
  const { data: referralTreeData = null } = useReferralTree({ token })
  const { data: biometricEnabled = false } = useSecuritySettings({ token })
  const { data: googleLinked = false } = useGoogleLinked({ token })
  const { data: userLeaderboardRank = null } = useUserLeaderboardRank({
    token,
    userId: user?.id,
  })
  const { data: walletData = null, isLoading: loadingWallet } = useWallet({
    token,
    walletType: "all",
  })
  const invalidateProfileScreen = useProfileScreenInvalidate()
  const queryClient = useQueryClient()

  // Re-check the Google linked status when the parent bumps the trigger
  // (e.g. after the user links/unlinks an account elsewhere).
  useEffect(() => {
    if (linkedAccountsRefreshTrigger && linkedAccountsRefreshTrigger > 0) {
      queryClient.invalidateQueries({ queryKey: ["googleLinked"] })
    }
  }, [linkedAccountsRefreshTrigger, queryClient])

  // handleViewNetwork can fetch a fresher tree on demand; prefer it when set.
  const [overrideReferralTree, setOverrideReferralTree] =
    useState<ReferralTree | null>(null)
  const referralTree = overrideReferralTree ?? referralTreeData
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

  const handleRefresh = async () => {
    if (!token || refreshing) return

    setRefreshing(true)
    try {
      await invalidateProfileScreen()
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

      setOverrideReferralTree(data)
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
        {/* ── Gradient header (matches the app header / website scheme) ── */}
        <LinearGradient
          colors={isDarkMode ? ["#0f172a", "#1e293b"] : [...gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBackground, { paddingTop: insets.top + 6 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerLeft}
              onPress={() => onShowProfileDetails?.(true)}
              activeOpacity={0.7}
            >
              <View style={styles.headerAvatar}>
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.headerAvatarImg}
                    transition={200}
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
                      style={[
                        styles.usernameText,
                        { color: "rgba(255,255,255,0.9)" },
                      ]}
                    >
                      @{user.username}
                    </Text>
                    {user?.badge_name && (
                      <View style={styles.userBadge}>
                        <Ionicons
                          name="shield-checkmark"
                          size={9}
                          color={Colors.white}
                        />
                        <Text style={styles.userBadgeText}>
                          {user.badge_name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.usernameDot} />
                    <Text
                      style={[
                        styles.usernamePvText,
                        { color: "rgba(255,255,255,0.85)" },
                      ]}
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

          {/* Frosted glass stats strip — mirrors the Home membership hero */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>
                {user?.monthly_activation?.remaining_pv ?? 0}
              </Text>
              <Text style={styles.heroStatLabel}>Total PV</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue} numberOfLines={1}>
                ₱{loyaltyData?.earnings || 0}
              </Text>
              <Text style={styles.heroStatLabel}>Earnings</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <TouchableOpacity
              style={styles.heroStatCell}
              onPress={() => setShowLeaderboard?.(true)}
              activeOpacity={0.7}
            >
              <View style={styles.heroStatValueRow}>
                <Ionicons name="trophy" size={13} color="#fbbf24" />
                <Text style={styles.heroStatValue}>
                  #{userLeaderboardRank ?? "-"}
                </Text>
              </View>
              <Text style={styles.heroStatLabel}>Rank</Text>
            </TouchableOpacity>
            <View style={styles.heroStatDivider} />
            <TouchableOpacity
              style={styles.heroStatCell}
              onPress={() => onShowReferralNetwork?.(referralTree)}
              activeOpacity={0.7}
            >
              <Text style={styles.heroStatValue}>
                {loyaltyData?.referral_count || 0}
              </Text>
              <Text style={styles.heroStatLabel}>Referrals</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

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

          {/* Daily Check-In — gold-accented reward card */}
          <TouchableOpacity
            style={[
              styles.checkinCard,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onShowPVEarner?.(true)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.checkinIconWrap,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(245, 158, 11, 0.15)"
                    : "#fffbeb",
                },
              ]}
            >
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_1_kpacst.png",
                }}
                style={styles.checkinIcon}
                contentFit="contain"
                transition={200}
              />
            </View>
            <View style={styles.checkinInfo}>
              <Text style={[styles.checkinTitle, { color: colors.text }]}>
                Daily Check-In
              </Text>
              <Text style={[styles.checkinSub, { color: colors.textSec }]}>
                Check in every day to earn PV rewards
              </Text>
            </View>
            {!dailyCheckinClaimed ? (
              <View style={styles.claimPill}>
                <View style={styles.dailyCheckinRedDot} />
                <Text style={styles.claimPillText}>Claim +20 PV</Text>
              </View>
            ) : (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSec}
              />
            )}
          </TouchableOpacity>

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
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardHeaderChip,
                    { backgroundColor: colors.purchaseIconBg },
                  ]}
                >
                  <Ionicons
                    name="bag-handle-outline"
                    size={15}
                    color={Colors.sky}
                  />
                </View>
                <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                  My Purchases
                </Text>
              </View>
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
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardHeaderChip,
                    { backgroundColor: colors.purchaseIconBg },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={15}
                    color={Colors.sky}
                  />
                </View>
                <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                  My Referrals
                </Text>
              </View>
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
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardHeaderChip,
                    { backgroundColor: colors.purchaseIconBg },
                  ]}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={15}
                    color={Colors.sky}
                  />
                </View>
                <View>
                  <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                    Affiliate Referral QR
                  </Text>
                  <Text style={[styles.qrSubtitle, { color: Colors.sky }]}>
                    Ready to Share
                  </Text>
                </View>
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
                      contentFit="contain"
                      transition={200}
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
                      contentFit="contain"
                      transition={200}
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
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardHeaderChip,
                    { backgroundColor: colors.purchaseIconBg },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={15}
                    color={Colors.sky}
                  />
                </View>
                <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                  AF Wallet
                </Text>
              </View>
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
                    <View
                      style={[
                        styles.walletIconChip,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(14,165,233,0.15)"
                            : "#e0f2fe",
                        },
                      ]}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={17}
                        color={Colors.sky}
                      />
                    </View>
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
                    <View
                      style={[
                        styles.walletIconChip,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(249,115,22,0.15)"
                            : "#ffedd5",
                        },
                      ]}
                    >
                      <Ionicons
                        name="ticket-outline"
                        size={17}
                        color="#f97316"
                      />
                    </View>
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
                    <View
                      style={[
                        styles.walletIconChip,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(245,158,11,0.15)"
                            : "#fffbeb",
                        },
                      ]}
                    >
                      <Image
                        source={{
                          uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_1_kpacst.png",
                        }}
                        style={styles.walletCardIcon}
                        contentFit="contain"
                        transition={200}
                      />
                    </View>
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
                    <View
                      style={[
                        styles.walletIconChip,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(139,92,246,0.15)"
                            : "#ede9fe",
                        },
                      ]}
                    >
                      <Ionicons
                        name="git-network-outline"
                        size={17}
                        color="#8b5cf6"
                      />
                    </View>
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
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  if (item.key === "logout") onLogout?.()
                  if (item.key === "settings") onNavigateSettings?.()
                  if (item.key === "wishlist") onNavigateWishlist?.()
                  if (item.key === "track") setShowTrackOrder(true)
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
                {item.key === "wishlist" && wishlistItems.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                    </Text>
                  </View>
                ) : null}
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
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.cardHeaderChip,
                    { backgroundColor: colors.purchaseIconBg },
                  ]}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={15}
                    color={Colors.sky}
                  />
                </View>
                <Text style={[styles.purchasesTitle, { color: colors.text }]}>
                  Connect with Us
                </Text>
              </View>
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
                contentFit="contain"
                transition={200}
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

      {/* Track Order — in-app browser */}
      <WebViewModal
        visible={showTrackOrder}
        url="https://afhome.ph/track-order"
        title="Track My Order"
        isDarkMode={isDarkMode}
        onClose={() => setShowTrackOrder(false)}
      />

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}
