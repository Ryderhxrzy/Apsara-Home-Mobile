import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { VideoView, useVideoPlayer } from "expo-video"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { authService, BrandItem, CategoryItem } from "../services/authService"
import { productService } from "../services/productService"
import { getBadgeImageSource } from "../constants/tierConfig"
import type { ProductCard } from "../services/productService"
import Toast from "react-native-toast-message"
import {
  HomeScreenSkeleton,
  BannerSkeleton,
  RoomGridSkeleton,
  CategoryRowSkeleton,
  BrandCardSkeleton,
} from "../components/SkeletonLoader/SkeletonLoader"
import { usePrefetchProducts } from "../hooks/usePrefetchProducts"
import { useCartCount } from "../hooks/query/useCartCount"
import { ChatBotIcon } from "../components/ChatBot"
import { FlashList } from "@shopify/flash-list"
import styles, { BANNER_HEIGHT } from "../styles/HomeScreen.styles"

interface HomeScreenProps {
  token?: string | null
  user?: {
    name?: string
    avatar_url?: string
    badge?: number
    badge_name?: string
    badge_image?: string | any
    monthly_activation?: {
      remaining_pv: number
    }
  } | null
  isDarkMode?: boolean
  onProductPress?: (id: number) => void
  onCartPress?: () => void
  onReferralPress?: () => void
  categories?: CategoryItem[]
  setCategories?: (categories: CategoryItem[]) => void
  brands?: BrandItem[]
  setBrands?: (brands: BrandItem[]) => void
  featuredProducts?: ProductCard[]
  setFeaturedProducts?: (products: ProductCard[]) => void
  roomTypes?: RoomType[]
  setRoomTypes?: (rooms: RoomType[]) => void
  loadingFeatured?: boolean
  setLoadingFeatured?: (loading: boolean) => void
  dataFetchedRef?: React.MutableRefObject<boolean>
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onShopByRoomPress?: (roomId: number) => void
  onShopByCategoryPress?: (categoryId: number) => void
  onShopByBrandPress?: (brandId: number) => void
  onRefresh?: () => Promise<void> | void
}

interface RoomType {
  room_id: number
  room_name: string
  image: string
  count: number
}

const FALLBACK_ROOMS: RoomType[] = [
  { room_id: 1, room_name: "Bedroom", image: "", count: 0 },
  { room_id: 2, room_name: "Kitchen", image: "", count: 0 },
  { room_id: 3, room_name: "Living Room", image: "", count: 0 },
  { room_id: 4, room_name: "Outdoor", image: "", count: 0 },
  { room_id: 5, room_name: "Study & Office", image: "", count: 0 },
  { room_id: 6, room_name: "Dining Room", image: "", count: 0 },
  { room_id: 7, room_name: "Laundry Room", image: "", count: 0 },
  { room_id: 8, room_name: "Bath Room", image: "", count: 0 },
]

const SCREEN_WIDTH = Dimensions.get("window").width

function sortByOrder(items: CategoryItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function getCategoryImages(category: CategoryItem) {
  if (category.image) return [category.image]
  const seed = encodeURIComponent(category.url || category.name)
  return [`https://picsum.photos/seed/${seed}/240/240`]
}

function getBrandImage(brand: BrandItem) {
  if (brand.logo) return brand.logo
  if (brand.image) return brand.image
  const seed = encodeURIComponent(brand.name)
  return `https://picsum.photos/seed/${seed}/320/180`
}

function getBrandInitial(brand: BrandItem) {
  return brand.name?.trim()?.charAt(0)?.toUpperCase() || "?"
}

function getBrandImageLayout(imageCount: number) {
  switch (imageCount) {
    case 1:
      return { flex: 1, height: "100%" as any }
    case 2:
      return { flex: 1, height: "100%" as any }
    case 3:
      return { flex: 1, height: "100%" as any }
    case 4:
      return { width: "50%" as any, height: "50%" as any }
    case 5:
    case 6:
    default:
      return { width: "33.33%" as any, height: "50%" as any }
  }
}

function getBrandLogo(brand: BrandItem) {
  if (brand.logo) return brand.logo
  if (brand.brand_image) return brand.brand_image
  if (brand.image) return brand.image
  return null
}

// Spacer between horizontal brand cards. FlashList ignores `gap` on
// contentContainerStyle, so spacing must come from an item separator.
function BrandSeparator() {
  return <View style={styles.brandSeparator} />
}

function CategoryCircle({
  category,
  index,
  onPress,
  isDarkMode,
  colors,
}: {
  category: CategoryItem
  index: number
  onPress?: (categoryId: number) => void
  isDarkMode?: boolean
  colors?: any
}) {
  const image = useMemo(() => getCategoryImages(category)[0], [category])
  const pulseAnim = useState(() => new Animated.Value(1))[0]
  const scale = useState(() => new Animated.Value(1))[0]

  const badgeType = index === 0 ? "Hot" : index === 2 ? "New" : null

  useEffect(() => {
    if (!badgeType) return
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [badgeType, pulseAnim])

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View
      style={[styles.categoryCircleItem, { transform: [{ scale }] }]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(category.id)}
      >
        <View
          style={[
            styles.circleImageWrap,
            styles.categoryCircle,
            { backgroundColor: isDarkMode ? colors?.card : Colors.white },
          ]}
        >
          <Image source={{ uri: image }} style={styles.circleImage} transition={200} />
          {badgeType && (
            <Animated.View
              style={[
                styles.categoryBadge,
                isDarkMode && styles.categoryBadgeDark,
                badgeType === "Hot"
                  ? { backgroundColor: "#ef4444" }
                  : { backgroundColor: "#3b82f6" },
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.categoryBadgeText}>{badgeType}</Text>
            </Animated.View>
          )}
        </View>
        <Text
          style={[styles.circleLabel, { color: colors?.text || Colors.text }]}
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function VideoBanner({ banner }: { banner: any }) {
  const player = useVideoPlayer(banner.videoSource, (player) => {
    player.loop = true
    player.muted = true
    player.play()
  })

  return (
    <VideoView player={player} style={styles.bannerVideo} contentFit="cover" />
  )
}

function SampleAdCard({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <View style={styles.sampleAdCard}>
      <LinearGradient
        colors={["#38bdf8", "#0284c7"]}
        style={styles.sampleAdGradient}
      >
        <Ionicons name="sparkles" size={28} color={Colors.white} />
        <Text style={styles.sampleAdTitle}>{title}</Text>
        <Text style={styles.sampleAdSubtitle}>{subtitle}</Text>
        <View style={styles.sampleAdBadge}>
          <Text style={styles.sampleAdBadgeText}>Ad</Text>
        </View>
      </LinearGradient>
    </View>
  )
}

function RoomItemComponent({
  item,
  onPress,
  isDarkMode,
  colors,
}: {
  item: RoomType
  onPress?: (roomId: number) => void
  isDarkMode?: boolean
  colors?: any
}) {
  const scale = useState(() => new Animated.Value(1))[0]

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const badge = item.room_id === 1 ? "New" : item.room_id === 3 ? "Hot" : null

  return (
    <Animated.View
      style={[
        styles.roomItem,
        {
          transform: [{ scale }],
          borderColor: isDarkMode ? colors?.border : "#e5e7eb",
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(item.room_id)}
        style={{ alignItems: "center", width: "100%", gap: 6 }}
      >
        <View style={styles.roomCircleContainer}>
          <View
            style={[
              styles.roomCircleWrap,
              { borderColor: isDarkMode ? colors?.border : "#e0f2fe" },
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.roomImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.roomCircleFallback,
                  {
                    backgroundColor: isDarkMode
                      ? colors?.sectionEven
                      : "#eff6ff",
                  },
                ]}
              >
                <Ionicons name="home-outline" size={24} color={Colors.sky} />
              </View>
            )}
          </View>
          {badge && (
            <View
              style={[
                styles.roomBadge,
                isDarkMode && styles.roomBadgeDark,
                badge === "Hot" ? { backgroundColor: "#ef4444" } : {},
              ]}
            >
              <Text style={styles.roomBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.circleLabel, { color: colors?.text || Colors.text }]}
          numberOfLines={2}
        >
          {item.room_name}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function HomeScreen({
  token,
  user,
  isDarkMode = false,
  onProductPress,
  onCartPress = () => {},
  onReferralPress = () => {},
  categories = [],
  setCategories = () => {},
  brands = [],
  setBrands = () => {},
  featuredProducts = [],
  setFeaturedProducts = () => {},
  roomTypes = [],
  setRoomTypes = () => {},
  loadingFeatured = false,
  setLoadingFeatured = () => {},
  dataFetchedRef,
  wishlistItems = [],
  onWishlistChange = () => {},
  onShopByRoomPress = () => {},
  onShopByCategoryPress = () => {},
  onShopByBrandPress = () => {},
  onRefresh: onRefreshProp,
}: HomeScreenProps) {
  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    card: isDarkMode ? "#1e293b" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#334155" : "#e2e8f0",
    sectionEven: isDarkMode ? "#1e293b" : "#f0f9ff",
    statsBg: isDarkMode ? "#1e293b" : "#f0f9ff",
  }

  const [refreshing, setRefreshing] = useState(false)
  const [activeBanner, setActiveBanner] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(0)
  const bannerRef = useRef<ScrollView>(null)

  // Prefetch products in background for instant Shop screen load
  usePrefetchProducts(token)

  // Cart count GET migrated to React Query
  const { data: cartCountData } = useCartCount({ token })
  const totalCart = cartCountData?.count ?? 0

  const handleRefresh = () => {
    console.log("🔄 [HOMESCREEN] PULL-TO-REFRESH TRIGGERED")
    setRefreshing(true)
    Promise.resolve(onRefreshProp?.()).finally(() => setRefreshing(false))
  }

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return
      try {
        const { orderService } = require("../services/orderService")
        const { referralService } = require("../services/referralService")

        const [orderCounts, referralData] = await Promise.all([
          orderService.getOrderCounts(token),
          referralService.getReferralTree(token),
        ])

        setTotalOrders(orderCounts?.all || 0)
        setTotalReferrals(referralData?.summary?.direct_count || 0)
      } catch (error) {
        console.log("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [token])

  // Data fetching is handled by parent (AppNavigator)
  // HomeScreen only handles pull-to-refresh

  const greeting = useMemo(() => {
    const firstName = user?.name?.split(" ")[0] ?? "there"
    return `Discover home essentials for ${firstName}`
  }, [user?.name])

  // Distribute products into two columns for masonry layout
  const masonryColumns = useMemo(() => {
    const leftColumn: any[] = []
    const rightColumn: any[] = []

    console.log("📊 Masonry Layout Debug:", {
      featuredProductsCount: featuredProducts.length,
      featuredProducts: featuredProducts.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    })

    featuredProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product)
      } else {
        rightColumn.push(product)
      }
    })

    // Add sample ads
    if (leftColumn.length > 0) {
      leftColumn.splice(1, 0, {
        id: "sample-ad-1",
        isAd: true,
        title: "Summer Sale",
        subtitle: "Up to 50% off",
      })
    }
    if (rightColumn.length > 0) {
      rightColumn.splice(2, 0, {
        id: "sample-ad-2",
        isAd: true,
        title: "New Arrivals",
        subtitle: "Explore now",
      })
    }

    console.log("📦 Masonry Columns Result:", {
      leftColumnCount: leftColumn.length,
      rightColumnCount: rightColumn.length,
      leftColumnItems: leftColumn.map((item) => ({
        id: item.id,
        isAd: item.isAd,
      })),
      rightColumnItems: rightColumn.map((item) => ({
        id: item.id,
        isAd: item.isAd,
      })),
    })

    return { leftColumn, rightColumn }
  }, [featuredProducts])

  const banners = useMemo(() => {
    const categoryName = categories[0]?.name ?? "Categories"
    const brandName = brands[0]?.name ?? "Brands"
    return [
      {
        type: "video" as const,
        videoSource: "https://res.cloudinary.com/dc05ncs6l/video/upload/v1780969092/home-login_dja56x.mp4",
        eyebrow: "Welcome",
        title: "Discover Your Dream Home",
        subtitle: "Explore our curated collection of premium home essentials.",
        accent: Colors.sky,
        icon: "play-circle-outline" as const,
      },
      {
        type: "content" as const,
        eyebrow: "Browse",
        title: "Shop by category",
        subtitle: `Explore ${categories.length} curated categories with image tiles.`,
        accent: Colors.sky,
        icon: "grid-outline" as const,
      },
      {
        type: "content" as const,
        eyebrow: "Discover",
        title: "Find top brands",
        subtitle: `Swipe to see brand collections like ${brandName}.`,
        accent: Colors.forest,
        icon: "pricetag-outline" as const,
      },
      {
        type: "content" as const,
        eyebrow: "Featured",
        title: "Fresh picks for you",
        subtitle: `Start with ${categoryName} and move across the collection.`,
        accent: Colors.brass,
        icon: "sparkles-outline" as const,
      },
    ]
  }, [categories, brands])

  function handleBannerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x
    const index = Math.round(x / (SCREEN_WIDTH - 16))
    setActiveBanner(index)
  }

  const renderBrandItem = useCallback(
    ({ item }: { item: BrandItem }) => {
      const logo = getBrandLogo(item)
      return (
        <Pressable onPress={() => onShopByBrandPress?.(item.id)}>
          <View
            style={[
              styles.brandCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.brandLogoContainer}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.brandLogoImage} transition={200} />
              ) : (
                <View
                  style={[
                    styles.brandLogoFallback,
                    { backgroundColor: Colors.sky },
                  ]}
                >
                  <Text style={styles.brandFallbackInitialLarge}>
                    {getBrandInitial(item)}
                  </Text>
                </View>
              )}
              <LinearGradient
                colors={["rgba(14, 165, 233, 0)", "rgba(14, 165, 233, 0.95)"]}
                style={styles.brandLogoOverlay}
              >
                <View style={styles.brandOverlayContent}>
                  <Text
                    style={[
                      styles.brandCardNameOverlay,
                      { color: Colors.white },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.total_products !== undefined && (
                    <View style={styles.brandProductBadge}>
                      <Ionicons
                        name="cube-outline"
                        size={12}
                        color={Colors.white}
                      />
                      <Text style={styles.brandProductCountOverlay}>
                        {item.total_products}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>
        </Pressable>
      )
    },
    [colors.card, colors.border, onShopByBrandPress]
  )

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.sky]}
            tintColor={isDarkMode ? "#fff" : Colors.sky}
          />
        }
      >
        {/* Ranking Badge */}
        <View
          style={[
            styles.rankingBadgeSection,
            {
              borderBottomColor: colors.border,
              width: SCREEN_WIDTH,
              marginHorizontal: -8,
            },
          ]}
        >
          <View
            style={[
              styles.memberCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.rankingBadgeWrapper,
                user?.badge && user.badge === 0 ? { opacity: 0.5 } : {},
              ]}
            >
              {user?.badge && user.badge > 0 ? (
                (() => {
                  const badgeSource = getBadgeImageSource(user.badge_image)
                  return badgeSource ? (
                    <Image
                      source={badgeSource}
                      style={styles.rankingBadgeImage}
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <Ionicons
                      name="shield-checkmark"
                      size={60}
                      color={Colors.white}
                    />
                  )
                })()
              ) : (
                <Image
                  source={{
                  uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png"
                }}
                  style={[
                    styles.rankingBadgeImage,
                    { tintColor: "#9ca3af", opacity: 0.7 },
                  ]}
                  contentFit="contain"
                  transition={200}
                />
              )}
            </View>

            <View style={styles.memberInfo}>
              <Text style={[styles.memberLabel, { color: colors.textSec }]}>
                Your Badge Level
              </Text>
              <Text style={[styles.rankingBadgeName, { color: colors.text }]}>
                {user?.badge && user.badge > 0
                  ? user.badge_name
                  : "No Badge Yet"}
              </Text>
              <Text
                style={[styles.rankingBadgeSubtext, { color: colors.textSec }]}
              >
                {user?.badge && user.badge > 0
                  ? "Grow your team and earn more per order."
                  : "Invite at least 2 people to earn your first badge."}
              </Text>
            </View>

            <View style={styles.badgeLogoContainer}>
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png"
                }}
                style={styles.badgeLogo}
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>

          <View
            style={[
              styles.quickActionRow,
              { width: SCREEN_WIDTH, marginHorizontal: -8 },
            ]}
          >
            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={onReferralPress}
            >
              <LinearGradient
                colors={["#f97316", "#fb923c"]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="people" size={16} color={Colors.white} />
                <Text style={styles.quickActionTitle}>Invite Friends</Text>
                <Text style={styles.quickActionSubtitle}>
                  Turn Invites and Orders into Earnings
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={onCartPress}
            >
              <LinearGradient
                colors={["#0284c7", "#0ea5e9"]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="bag-check" size={16} color={Colors.white} />
                <Text style={styles.quickActionTitle}>Order Now</Text>
                <Text style={styles.quickActionSubtitle}>
                  Earn Performance Value (PV) Faster
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.statsBar,
            {
              backgroundColor: colors.statsBg,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.statsItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.statsMain}>
              <Ionicons name="receipt-outline" size={18} color="#f97316" />
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {totalOrders}
              </Text>
            </View>
            <Text style={[styles.statsLabel, { color: colors.textSec }]}>
              Total Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statsItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={onCartPress}
          >
            <View style={styles.statsMain}>
              <Ionicons name="cart-outline" size={18} color="#0ea5e9" />
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {totalCart}
              </Text>
            </View>
            <Text style={[styles.statsLabel, { color: colors.textSec }]}>
              Total Cart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statsItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={onReferralPress}
          >
            <View style={styles.statsMain}>
              <Ionicons name="people-outline" size={18} color="#22c55e" />
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {totalReferrals}
              </Text>
            </View>
            <Text style={[styles.statsLabel, { color: colors.textSec }]}>
              Total Referrals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statsItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.statsMain}>
              <Ionicons name="trending-up-outline" size={18} color="#ef4444" />
              <Text style={[styles.statsValue, { color: colors.text }]}>
                {user?.monthly_activation?.remaining_pv ?? 0}
              </Text>
            </View>
            <Text style={[styles.statsLabel, { color: colors.textSec }]}>
              Perf. Value
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bannerShell}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH - 16}
            snapToAlignment="start"
            bounces={true}
          >
            {banners.map((banner, index) => (
              <View
                key={`banner-${index}`}
                style={[styles.banner, { width: SCREEN_WIDTH - 16 }]}
              >
                {banner.type === "video" ? (
                  <>
                    <VideoBanner banner={banner} />
                    <View style={styles.videoOverlay} />
                    <View
                      style={[
                        styles.bannerGlow,
                        { backgroundColor: banner.accent },
                      ]}
                    />
                    <View style={styles.bannerTextWrap}>
                      <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>
                        {banner.subtitle}
                      </Text>
                    </View>
                    <View style={styles.bannerIcon}>
                      <Ionicons
                        name={banner.icon}
                        size={30}
                        color={banner.accent}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.bannerGlow,
                        { backgroundColor: banner.accent },
                      ]}
                    />
                    <View style={styles.bannerTextWrap}>
                      <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>
                        {banner.subtitle}
                      </Text>
                    </View>
                    <View style={styles.bannerIcon}>
                      <Ionicons
                        name={banner.icon}
                        size={30}
                        color={banner.accent}
                      />
                    </View>
                  </>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {banners.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  { backgroundColor: isDarkMode ? "#475569" : "#cbd5e1" },
                  activeBanner === index && [
                    styles.dotActive,
                    { backgroundColor: Colors.sky },
                  ],
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Shop by Rooms
            </Text>
            <View style={styles.sectionAction}>
              <Text style={[styles.sectionMeta, { color: colors.textSec }]}>
                {roomTypes.length || FALLBACK_ROOMS.length} total
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSec}
              />
            </View>
          </View>
          <FlatList
            data={roomTypes.length > 0 ? roomTypes : FALLBACK_ROOMS}
            renderItem={({ item }) => (
              <RoomItemComponent
                item={item}
                onPress={onShopByRoomPress}
                isDarkMode={isDarkMode}
                colors={colors}
              />
            )}
            keyExtractor={(item) => `room-${item.room_id}`}
            numColumns={4}
            contentContainerStyle={styles.roomGrid}
            scrollEnabled={false}
          />
        </View>

        <View
          style={[styles.sectionEven, { backgroundColor: colors.sectionEven }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Shop by Categories
            </Text>
            <View style={styles.sectionAction}>
              <Text style={[styles.sectionMeta, { color: colors.textSec }]}>
                {categories.length} total
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSec}
              />
            </View>
          </View>
          {loadingFeatured && categories.length === 0 ? (
            <CategoryRowSkeleton />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.circleRow}
            >
              <FlashList
                data={categories}
                renderItem={({ item, index }) => (
                  <CategoryCircle
                    category={item}
                    index={index}
                    onPress={onShopByCategoryPress}
                    isDarkMode={isDarkMode}
                    colors={colors}
                  />
                )}
                keyExtractor={(item) => `category-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.circleRow}
              />
            </ScrollView>
          )}
        </View>

        <View style={[styles.sectionOdd, { backgroundColor: colors.bg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Shop by Brand
            </Text>
            <View style={styles.sectionAction}>
              <Text style={[styles.sectionMeta, { color: colors.textSec }]}>
                {brands.length} total
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSec}
              />
            </View>
          </View>
          {loadingFeatured && brands.length === 0 ? (
            <BrandCardSkeleton />
          ) : (
            <FlashList
              data={brands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => `brand-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={BrandSeparator}
              contentContainerStyle={styles.brandRowHorizontal}
            />
          )}
        </View>

      </ScrollView>

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}

export default React.memo(HomeScreen)
