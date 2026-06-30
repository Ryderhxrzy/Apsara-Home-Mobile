import React, { useEffect, useState, useMemo, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  BackHandler,
  TextInput,
  Modal,
  Share,
  Animated,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BadgeCheck } from "lucide-react-native"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { CategoryItem } from "../services/authService"
import { useBrandHome } from "../hooks/query/useBrandHome"
import BrandProfileHeader from "./ShopByBrand/BrandProfileHeader"
import ShopByBrandHomeScreen from "./ShopByBrand/ShopByBrandHomeScreen"
import ShopByBrandProductsScreen from "./ShopByBrand/ShopByBrandProductsScreen"
import ShopByBrandCategoriesScreen from "./ShopByBrand/ShopByBrandCategoriesScreen"
import Toast from "react-native-toast-message"
import { useBrandFollow } from "../hooks/query/useBrandFollow"
import styles from "../styles/ShopByBrandScreen.styles"

/** Compact follower count, e.g. 12500 → "12.5K", 2_300_000 → "2.3M". */
function formatFollowerCount(count: number | null): string {
  if (count == null) return "…"
  if (count >= 1_000_000)
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (count >= 1_000)
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return String(count)
}

interface Room {
  room_id: number
  slug: string
  room_name: string
}

const ROOMS: Room[] = [
  { room_id: 1, slug: "bedroom", room_name: "Bedroom" },
  { room_id: 2, slug: "kitchen", room_name: "Kitchen" },
  { room_id: 3, slug: "living-room", room_name: "Living Room" },
  { room_id: 4, slug: "outdoor", room_name: "Outdoor" },
  { room_id: 5, slug: "study-office-room", room_name: "Study & Office" },
  { room_id: 6, slug: "dining-room", room_name: "Dining Room" },
  { room_id: 7, slug: "laundry-room", room_name: "Laundry Room" },
  { room_id: 8, slug: "bathroom", room_name: "Bathroom" },
]

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

/**
 * Compact top bar that fades in (native-driver opacity) as its tab is scrolled.
 * One per tab, so each tab collapses its own brand header independently.
 */
function CollapsingTopBar({
  scrollY,
  style,
  children,
}: {
  scrollY: Animated.Value
  style?: any
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setActive(value > 150))
    return () => scrollY.removeListener(id)
  }, [scrollY])
  const opacity = scrollY.interpolate({
    inputRange: [90, 170],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })
  return (
    <Animated.View
      pointerEvents={active ? "auto" : "none"}
      style={[style, { opacity }]}
    >
      {children}
    </Animated.View>
  )
}

interface BrandInfo {
  id: number
  name: string
  logo?: string
  brand_image?: string
  image?: string
  total_products?: number
  supplier_name?: string
  tagline?: string
  isZqBrand?: boolean
}

interface AuthUser {
  name?: string
  avatar_url?: string
  badge?: number
  badge_name?: string
  badge_image?: string
}

interface WishlistItem {
  id: number
  product_id: number
}

/** Unified product shape for both regular API products and ZQ-sourced products. */
interface BrandProduct {
  id: number
  name: string
  image: string
  // FeaturedItems fields
  price?: number
  priceMember?: number
  priceDp?: number
  original_price?: number
  discounted_price?: number
  prodpv?: string
  pv?: string
  musthave?: boolean
  bestseller?: boolean
  salespromo?: boolean
  // ItemCard fields
  originalPrice?: number
  memberPrice?: number
  priceSrp?: number
  soldCount?: number
  brand?: string
  variants?: unknown[]
  isZqProduct?: boolean
}

interface ShopByBrandScreenProps {
  token?: string | null
  user?: AuthUser
  cartCount?: number
  brandId?: number
  brand?: BrandInfo
  isZqBrand?: boolean
  categories?: CategoryItem[]
  onBack?: () => void
  onProductPress?: (id: number) => void
  onCartPress?: () => void
  wishlistItems?: WishlistItem[]
  onWishlistChange?: () => void
  isDarkMode?: boolean
}

export default function ShopByBrandScreen({
  token,
  user: _user,
  cartCount: _cartCount = 0,
  brandId,
  brand,
  isZqBrand = false,
  categories = [],
  onBack = () => {},
  onProductPress = () => {},
  onCartPress: _onCartPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
  isDarkMode = false,
}: ShopByBrandScreenProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<
    "home" | "products" | "categories"
  >("home")
  const [showMenu, setShowMenu] = useState(false)

  const insets = useSafeAreaInsets()

  // DB-driven mobile home (sections + cover photo) configured by the brand owner.
  // ZQ/global brands have no builder, so skip the fetch for them.
  const {
    data: brandHomeData,
    isLoading: homeLoading,
    refetch: refetchHome,
  } = useBrandHome({
    token,
    brandId,
    enabled: !isZqBrand,
  })
  const homeSections = brandHomeData?.sections ?? []
  const coverPhoto = brandHomeData?.cover?.image_url ?? null

  const onRefresh = () => {
    refetchHome()
  }

  const handleFollowPress = () => {
    toggleFollow({
      onSuccess: (nowFollowing) => {
        Toast.show({
          type: "success",
          text1: nowFollowing ? "Followed" : "Unfollowed",
          text2: `You ${nowFollowing ? "now follow" : "unfollowed"} ${brand?.name ?? "this brand"}`,
        })
      },
      onError: (message) => {
        Toast.show({
          type: "error",
          text1: "Failed to update follow status",
          text2: message,
        })
      },
    })
  }

  useEffect(() => {
    if (token && brandId) {
      checkFollowingStatus()
    } else {
      setIsFollowing(false)
    }
  }, [token, brandId, checkFollowingStatus])

  const getBrandLogo = (): string | null => {
    return brand?.logo ?? brand?.brand_image ?? brand?.image ?? null
  }

  const getBrandInitial = (): string => {
    return brand?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?"
  }

  const handleShareBrand = async () => {
    setShowMenu(false)
    try {
      await Share.share({
        message: `Check out ${brand?.name ?? "this brand"} on our app!`,
        title: brand?.name ?? "Brand",
      })
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  const handleReportBrand = () => {
    setShowMenu(false)
    Toast.show({
      type: "info",
      text1: "Report Brand",
      text2: "Thank you for your report. We will review it shortly.",
    })
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack()
      return true
    })
    return () => sub.remove()
  }, [onBack])

  const themeColors = {
    containerBg: isDarkMode ? "#0f172a" : "#f8fafc",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1f2937" : Colors.white,
    cardBorder: isDarkMode ? "#374151" : "#e5e7eb",
    searchBg: isDarkMode ? "#0f172a" : "#f1f5f9",
    followingBg: isDarkMode ? "rgba(14,165,233,0.15)" : "#e0f2fe",
  }

  const brandLogo = getBrandLogo()

  // ── Collapsing header (shared across tabs) ───────────────────────────────
  // Every tab renders the full brand header at the top of its own scroll. One
  // shared scroll value drives the compact bar, and on tab switch we carry the
  // collapse state over (sync the new tab's scroll) so the header looks identical
  // on Home, Products and Categories.
  const scrollY = useRef(new Animated.Value(0)).current
  const scrollOffset = useRef(0)
  const homeListRef = useRef<any>(null)
  const productsListRef = useRef<any>(null)
  const categoriesScrollRef = useRef<any>(null)

  const onAnyScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: any) => {
          scrollOffset.current = e?.nativeEvent?.contentOffset?.y ?? 0
        },
      }),
    [scrollY]
  )

  const scrollActiveTo = useCallback(
    (offset: number, animated = false) => {
      if (selectedTab === "home")
        homeListRef.current?.scrollToOffset?.({ offset, animated })
      else if (selectedTab === "products")
        productsListRef.current?.scrollToOffset?.({ offset, animated })
      else categoriesScrollRef.current?.scrollTo?.({ y: offset, animated })
    },
    [selectedTab]
  )

  // Carry the header's collapse state across tabs: when switching, scroll the new
  // tab to the same offset (clamped to the header range so it never jumps deep).
  useEffect(() => {
    const target = Math.min(scrollOffset.current, 200)
    const id = requestAnimationFrame(() => scrollActiveTo(target, false))
    return () => cancelAnimationFrame(id)
  }, [selectedTab, scrollActiveTo])

  // Tab strip — full (inside the brand header) or compact (inside the bar).
  const renderTabs = (compactVariant: boolean) => (
    <View style={compactVariant ? styles.tabBarCompact : styles.tabBar}>
      {(["home", "products", "categories"] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={compactVariant ? styles.tabItemCompact : styles.tabItem}
          onPress={() => setSelectedTab(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              compactVariant ? styles.tabTextCompact : styles.tabText,
              { color: themeColors.textSecondary },
              selectedTab === tab && styles.tabTextActive,
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {selectedTab === tab && (
            <View
              style={[
                compactVariant
                  ? styles.tabIndicatorCompact
                  : styles.tabIndicator,
                { backgroundColor: Colors.sky },
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  )

  // Compact bar content: back + tabs + search icon + 3-dots.
  const renderCompactBar = (onSearchPress: () => void) => (
    <View style={styles.compactRow}>
      <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={themeColors.text} />
      </TouchableOpacity>
      {renderTabs(true)}
      <TouchableOpacity
        onPress={onSearchPress}
        style={styles.iconButton}
        hitSlop={8}
      >
        <Ionicons name="search-outline" size={22} color={themeColors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowMenu(true)}
        style={styles.iconButton}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={themeColors.text} />
      </TouchableOpacity>
    </View>
  )

  // Brand header (cover + nav + profile + tabs) — its own component, rendered at
  // the top of each tab's scroll so it scrolls away naturally.
  const brandProfileHeader = (
    <BrandProfileHeader
      brandName={brand?.name}
      brandLogo={brandLogo}
      brandInitial={getBrandInitial()}
      coverPhoto={coverPhoto}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onBack={onBack}
      onMenuPress={() => setShowMenu(true)}
      isFollowing={isFollowing}
      followLoading={followLoading}
      onFollowPress={handleFollowPress}
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      isDarkMode={isDarkMode}
    />
  )

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.containerBg }]}
    >
      {/* All three tabs stay MOUNTED (toggled via display) so switching is
          instant and each keeps its scroll position + data. Each tab carries the
          full brand header in its own scroll + its own collapsing compact bar. */}
      <View
        style={[
          styles.tabPage,
          selectedTab === "home" ? styles.tabPageActive : styles.tabPageHidden,
        ]}
        pointerEvents={selectedTab === "home" ? "auto" : "none"}
      >
        <ShopByBrandHomeScreen
          sections={homeSections}
          token={token}
          brandId={brandId}
          isZqBrand={isZqBrand}
          isDarkMode={isDarkMode}
          onProductPress={onProductPress}
          wishlistItems={wishlistItems}
          onWishlistChange={onWishlistChange}
          sectionsLoading={homeLoading}
          onRefreshSections={onRefresh}
          profileHeader={brandProfileHeader}
          onScroll={onAnyScroll}
          listRef={homeListRef}
          onSeeMore={() => setSelectedTab("products")}
        />
      </View>

      <View
        style={[
          styles.tabPage,
          selectedTab === "products"
            ? styles.tabPageActive
            : styles.tabPageHidden,
        ]}
        pointerEvents={selectedTab === "products" ? "auto" : "none"}
      >
        <ShopByBrandProductsScreen
          token={token}
          brandId={brandId}
          isZqBrand={isZqBrand}
          categoryId={selectedCategoryId}
          searchQuery={searchQuery}
          wishlistItems={wishlistItems}
          onWishlistChange={onWishlistChange}
          onProductPress={onProductPress}
          isDarkMode={isDarkMode}
          header={brandProfileHeader}
          onScroll={onAnyScroll}
          listRef={productsListRef}
        />
      </View>

      <View
        style={[
          styles.tabPage,
          selectedTab === "categories"
            ? styles.tabPageActive
            : styles.tabPageHidden,
        ]}
        pointerEvents={selectedTab === "categories" ? "auto" : "none"}
      >
        <AnimatedScrollView
          ref={categoriesScrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onAnyScroll}
          scrollEventThrottle={16}
        >
          {brandProfileHeader}
          <View style={styles.categoriesBody}>
            <ShopByBrandCategoriesScreen
              categories={categories}
              isDarkMode={isDarkMode}
              onCategoryPress={(categoryId) => {
                setSelectedCategoryId(categoryId)
                setSelectedTab("products")
              }}
              onShopNow={() => setSelectedTab("products")}
            />
          </View>
        </AnimatedScrollView>
      </View>

      {/* Single shared compact bar — same collapse state across all tabs */}
      <CollapsingTopBar
        scrollY={scrollY}
        style={[
          styles.compactBarFixed,
          {
            paddingTop: insets.top,
            backgroundColor: themeColors.cardBg,
            borderBottomColor: themeColors.cardBorder,
          },
        ]}
      >
        {renderCompactBar(() => scrollActiveTo(0, true))}
      </CollapsingTopBar>

      {/* Menu Modal (Share / Report) */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menuContainer,
              { top: insets.top + 56, backgroundColor: themeColors.cardBg },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShareBrand}
            >
              <Ionicons
                name="share-social"
                size={18}
                color={Colors.sky}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: themeColors.text }]}>
                Share Brand
              </Text>
            </TouchableOpacity>
            <View
              style={[
                styles.menuDivider,
                { backgroundColor: themeColors.cardBorder },
              ]}
            />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReportBrand}
            >
              <Ionicons
                name="flag"
                size={18}
                color="#ef4444"
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: "#ef4444" }]}>
                Report Brand
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
