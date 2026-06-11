import React, { useState, useEffect, useRef } from "react"
import {
  Animated,
  Linking,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../../constants/colors"
import { productService } from "../../services/productService"
import HeaderFilter from "./HeaderFilter"

interface AppHeaderProps {
  user?: {
    name: string
    username?: string
    avatar_url?: string
    avatar_original_url?: string
    badge_name?: string
    badge_image?: string | any
    money_balance?: number
    wallet_balance?: number
    monthly_activation?: {
      current_month_pv: number
      threshold_pv: number
      remaining_pv: number
    }
  } | null
  onNotificationPress?: () => void
  onCartPress?: () => void
  onFilterPress?: () => void
  onSearchPress?: () => void
  onCameraPress?: () => void
  onProfilePress?: () => void
  onLogout?: () => void
  searchPlaceholder?: string
  cartCount?: number
  showRoomFilter?: boolean
  selectedRoom?: string
  onRoomFilterChange?: (filterType: string, value: any) => void
  showCategoryFilter?: boolean
  selectedCategory?: string
  categories?: any[]
  showBrandFilter?: boolean
  selectedBrand?: string
  brands?: any[]
  isDarkMode?: boolean
  showScrollToTop?: boolean
  onScrollToTop?: () => void
}

const MARQUEE_ITEMS = [
  "Summer Sale - Up to 50% off selected items",
  "New arrivals every week",
  "Nationwide delivery to all major cities",
  "Installment available via GCash & Maya",
  "Free Shipping on orders over PHP 5,000",
]

const SOCIAL_LINKS = [
  { icon: "globe" as const, url: "https://www.afhome.ph" },
  { icon: "logo-facebook" as const, url: "https://www.facebook.com/AFHomePH/" },
  {
    icon: "logo-instagram" as const,
    url: "https://www.instagram.com/afhome.ph/",
  },
  { icon: "logo-tiktok" as const, url: "https://www.tiktok.com/@afhomeph" },
]

function MarqueeItems() {
  return (
    <>
      {MARQUEE_ITEMS.map((text, i) => (
        <View key={i} style={marqueeStyles.item}>
          <Text style={marqueeStyles.text}>{text}</Text>
          <Image
            source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png",
            }}
            style={marqueeStyles.logo}
            contentFit="contain"
            transition={200}
          />
        </View>
      ))}
    </>
  )
}

function MarqueeBanner({ isDarkMode }: { isDarkMode?: boolean }) {
  const tx1 = useState(() => new Animated.Value(0))[0]
  const tx2 = useState(() => new Animated.Value(0))[0]
  const pos1 = useRef(0)
  const pos2 = useRef(0)
  const contentWidthRef = useRef(0)
  const isScrollingRef = useRef(false)
  const marqueeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startScrolling = (cw: number) => {
    if (isScrollingRef.current) return // Already scrolling
    isScrollingRef.current = true

    pos1.current = 0
    pos2.current = cw
    tx1.setValue(0)
    tx2.setValue(cw)

    const tick = () => {
      pos1.current -= 0.7
      pos2.current -= 0.7

      if (pos1.current <= -cw) pos1.current = cw
      if (pos2.current <= -cw) pos2.current = cw

      tx1.setValue(pos1.current)
      tx2.setValue(pos2.current)
    }

    // Clear any prior interval before starting a new one so layout changes
    // can't accumulate multiple concurrent loops.
    if (marqueeIntervalRef.current) clearInterval(marqueeIntervalRef.current)
    marqueeIntervalRef.current = setInterval(tick, 16)
  }

  useEffect(() => {
    if (contentWidthRef.current > 0) {
      startScrolling(contentWidthRef.current)
    }
    return () => {
      if (marqueeIntervalRef.current) {
        clearInterval(marqueeIntervalRef.current)
        marqueeIntervalRef.current = null
      }
      isScrollingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; startScrolling is recreated each render and is guarded by isScrollingRef
  }, [])

  const handleLayout = (e: any) => {
    const w = e.nativeEvent.layout.width
    if (w && w !== contentWidthRef.current) {
      contentWidthRef.current = w
      isScrollingRef.current = false
      startScrolling(w)
    }
  }

  return (
    <View
      style={[
        marqueeStyles.container,
        isDarkMode && { backgroundColor: "#0284c7" },
      ]}
    >
      <View style={marqueeStyles.scrollArea}>
        <Animated.View
          style={[marqueeStyles.row, { transform: [{ translateX: tx1 }] }]}
          onLayout={handleLayout}
        >
          <MarqueeItems />
        </Animated.View>
        <Animated.View
          style={[marqueeStyles.row, { transform: [{ translateX: tx2 }] }]}
        >
          <MarqueeItems />
        </Animated.View>
      </View>

      <View style={marqueeStyles.socialRow}>
        {SOCIAL_LINKS.map(({ icon, url }) => (
          <TouchableOpacity
            key={url}
            onPress={() => Linking.openURL(url)}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={14} color={Colors.white} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function AppHeader({
  user,
  onCartPress,
  onSearchPress,
  onCameraPress,
  onProfilePress,
  searchPlaceholder = "Search...",
  cartCount = 0,
  showRoomFilter = false,
  selectedRoom = "Bedroom",
  onRoomFilterChange,
  showCategoryFilter = false,
  selectedCategory = "All Categories",
  categories = [],
  showBrandFilter = false,
  selectedBrand = "All Brands",
  brands = [],
  isDarkMode = false,
  showScrollToTop = false,
  onScrollToTop,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  const [imageLoadError, setImageLoadError] = useState(false)
  const photoUrl = !imageLoadError
    ? user?.avatar_url || user?.avatar_original_url
    : null
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : null
  const fullName = user?.name || "Guest"
  const badgeName = user?.badge_name
  const moneyBalance = user?.money_balance ?? user?.wallet_balance ?? 0

  const [dynamicPlaceholder, setDynamicPlaceholder] =
    useState(searchPlaceholder)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(showRoomFilter)
  const [prevShowRoomFilter, setPrevShowRoomFilter] = useState(showRoomFilter)
  const [showBalance, setShowBalance] = useState(true)
  const currentIndex = useRef(0)

  if (showRoomFilter !== prevShowRoomFilter) {
    setPrevShowRoomFilter(showRoomFilter)
    setShowFilter(showRoomFilter)
  }

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const products = await productService.getProductCards()
        if (products && products.length > 0) {
          // Shuffle and pick 10 random items
          const shuffled = [...products].sort(() => 0.5 - Math.random())
          const names = shuffled
            .map((p) => `Try "${p.name.split(" ").slice(0, 2).join(" ")}"`)
            .slice(0, 10)

          setSuggestions(names)
          if (names.length > 0) {
            setDynamicPlaceholder(names[0])
          }
        }
      } catch {
        // Fallback to static suggestions if API fails
        setSuggestions([
          'Try "Sofa"',
          'Try "Table"',
          'Try "Bed"',
          'Try "Chair"',
        ])
      }
    }
    loadSuggestions()
  }, [])

  useEffect(() => {
    if (suggestions.length === 0) return
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % suggestions.length
      setDynamicPlaceholder(suggestions[currentIndex.current])
    }, 3500)
    return () => clearInterval(interval)
  }, [suggestions])

  return (
    <>
      <View style={styles.headerBackground}>
        <Image
          source={{
            uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969375/header_bg_jjpkvu.png",
          }}
          style={styles.headerBackgroundImage}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          {/* <MarqueeBanner isDarkMode={isDarkMode} /> */}

          <View style={styles.innerContent}>
            <View style={styles.topRow}>
              <TouchableOpacity
                style={styles.profileSection}
                onPress={onProfilePress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatar,
                    isDarkMode && { backgroundColor: "#374151" },
                  ]}
                >
                  {photoUrl && !imageLoadError ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.avatarImage}
                      onError={() => setImageLoadError(true)}
                      transition={200}
                    />
                  ) : initial ? (
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  ) : (
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={isDarkMode ? "#9ca3af" : Colors.textSecondary}
                    />
                  )}
                </View>
                <View style={styles.nameContainer}>
                  <Text style={[styles.welcomeText, { color: Colors.white }]}>
                    Welcome back,
                  </Text>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.nameText, { color: Colors.white }]}
                      numberOfLines={1}
                    >
                      {fullName}
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
                      {badgeName && (
                        <>
                          <View style={styles.usernameDot} />
                          <View style={styles.userBadge}>
                            <Ionicons
                              name="shield-checkmark"
                              size={10}
                              color={Colors.white}
                            />
                            <Text style={styles.userBadgeText}>
                              {badgeName}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.rightActions}>
                <TouchableOpacity
                  style={[
                    styles.pvBadge,
                    isDarkMode && { backgroundColor: "#0284c7" },
                  ]}
                  onPress={() => setShowBalance(!showBalance)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showBalance ? "eye-outline" : "eye-off-outline"}
                    size={12}
                    color={Colors.white}
                  />
                  <Text style={styles.pvText}>
                    {showBalance ? `₱${moneyBalance.toLocaleString()}` : "••••"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, isDarkMode && styles.iconBtnDark]}
                  onPress={onCartPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="cart-outline"
                    size={20}
                    color={Colors.white}
                  />
                  {cartCount > 0 && (
                    <View
                      style={[
                        styles.cartBadge,
                        isDarkMode && styles.cartBadgeDark,
                      ]}
                    >
                      <Text style={styles.cartBadgeText}>
                        {cartCount > 99 ? "99+" : cartCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchRow}>
              <TouchableOpacity
                style={[
                  styles.searchWrapper,
                  isDarkMode && styles.searchWrapperDark,
                ]}
                onPress={onSearchPress}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={Colors.white}
                  style={styles.searchIconLeft}
                />
                <Text
                  style={[styles.searchPlaceholder, { color: Colors.white }]}
                  numberOfLines={1}
                >
                  {dynamicPlaceholder}
                </Text>
                <TouchableOpacity
                  onPress={onCameraPress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="mic-outline"
                    size={16}
                    color={Colors.white}
                    style={styles.cameraIconInside}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  isDarkMode && styles.iconBtnDark,
                  showFilter && styles.iconBtnActive,
                ]}
                onPress={() => setShowFilter(!showFilter)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {showFilter && (
        <HeaderFilter
          showRoomFilter={showRoomFilter}
          selectedRoom={selectedRoom}
          showCategoryFilter={showCategoryFilter}
          selectedCategory={selectedCategory}
          categories={categories}
          showBrandFilter={showBrandFilter}
          selectedBrand={selectedBrand}
          brands={brands}
          isDarkMode={isDarkMode}
          showScrollToTop={showScrollToTop}
          onScrollToTop={onScrollToTop}
          onFilterChange={(filterType, value) => {
            onRoomFilterChange?.(filterType, value)
          }}
        />
      )}
    </>
  )
}

const marqueeStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.sky,
    height: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  scrollArea: {
    flex: 1,
    overflow: "hidden",
    height: 30,
  },
  row: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 6,
  },
  logo: {
    width: 70,
    height: 22,
    tintColor: Colors.white,
  },
  text: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    height: 30,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.35)",
  },
})

const styles = StyleSheet.create({
  headerBackground: {
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    minHeight: 170,
  },
  headerBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  containerDark: {
    backgroundColor: "#1f2937",
    borderBottomColor: "#374151",
  },
  innerContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pvBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pvText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.sky,
  },
  avatarDark: {
    backgroundColor: "#374151",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.sky,
  },
  welcomeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "400",
  },
  nameContainer: {
    flex: 1,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    flexShrink: 1,
  },
  profileIcon: {
    marginLeft: 4,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  usernameText: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: "600",
  },
  usernameDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#cbd5e1",
  },
  usernamePvText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    height: 18,
  },
  badgeImageSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDark: {},
  iconBtnActive: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  searchWrapperDark: {},
  searchIcon: {
    marginRight: 6,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  cameraIconInside: {
    marginLeft: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeDark: {
    borderColor: "#1f2937",
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 11,
  },
  profileMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 80,
    paddingLeft: 12,
  },
  profileMenu: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileMenuDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  menuDividerDark: {
    backgroundColor: "#374151",
  },
  menuLabelDark: {
    color: "#f8fafc",
  },
  usernameDotDark: {
    backgroundColor: "#4b5563",
  },
})
