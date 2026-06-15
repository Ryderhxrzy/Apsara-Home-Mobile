import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
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
} from "react-native"
import { Image, ImageBackground } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { CategoryItem } from "../services/authService"
import { useBrandProducts } from "../hooks/query/useBrandProducts"
import ShopByBrandHomeScreen from "./ShopByBrand/ShopByBrandHomeScreen"
import ShopByBrandProductsScreen from "./ShopByBrand/ShopByBrandProductsScreen"
import ShopByBrandCategoriesScreen from "./ShopByBrand/ShopByBrandCategoriesScreen"
import Toast from "react-native-toast-message"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import styles from "../styles/ShopByBrandScreen.styles"

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
  const selectedRoomId: number | null = null
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"home" | "products" | "categories">("home")
  const [showMenu, setShowMenu] = useState(false)

  const perPage = 20
  const scrollViewRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  const selectedRoom = useMemo<Room | undefined>(
    () => (selectedRoomId ? ROOMS.find((r) => r.room_id === selectedRoomId) : undefined),
    [selectedRoomId]
  )
  void selectedRoom // referenced via filter params

  const {
    data: brandProductsData,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useBrandProducts({
    token,
    brandId,
    isZqBrand,
    page: currentPage,
    perPage,
    roomId: selectedRoomId,
    categoryId: selectedCategoryId,
    search: searchQuery,
  })

  const products: BrandProduct[] = brandProductsData?.products ?? []
  const totalPages = brandProductsData?.totalPages ?? 0
  const loading = isLoading
  const refreshing = isRefetching

  useEffect(() => {
    if (isError) {
      const msg = error instanceof Error ? error.message : "Please try again"
      Toast.show({ type: "error", text1: "Failed to load products", text2: msg })
    }
  }, [isError, error])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRoomId, selectedCategoryId, searchQuery])

  const onRefresh = () => {
    refetch()
  }

  const checkFollowingStatus = useCallback(async () => {
    if (!token || !brandId) return
    try {
      const response = await axios.post<{
        is_following?: boolean | number
        data?: { is_following?: boolean | number }
      }>(
        `${API_CONFIG.BASE_URL}/followers/is-following`,
        { brand_id: brandId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      let isFollowingStatus = false
      if (response.data?.is_following !== undefined) {
        isFollowingStatus =
          response.data.is_following === true || response.data.is_following === 1
      } else if (response.data?.data?.is_following !== undefined) {
        isFollowingStatus =
          response.data.data.is_following === true ||
          response.data.data.is_following === 1
      } else if (typeof response.data === "boolean") {
        isFollowingStatus = response.data
      }

      setIsFollowing(isFollowingStatus)
    } catch (error) {
      console.error("Error checking follow status:", error)
      setIsFollowing(false)
    }
  }, [token, brandId])

  const handleFollowPress = async () => {
    if (!token || !brandId) return
    setFollowLoading(true)
    try {
      const endpoint = isFollowing ? "unfollow" : "follow"
      await axios.post(
        `${API_CONFIG.BASE_URL}/followers/${endpoint}`,
        { brand_id: brandId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsFollowing((prev) => !prev)
      Toast.show({
        type: "success",
        text1: isFollowing ? "Unfollowed" : "Followed",
        text2: `You ${isFollowing ? "unfollowed" : "now follow"} ${brand?.name ?? "this brand"}`,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Please try again"
      Toast.show({ type: "error", text1: "Failed to update follow status", text2: msg })
    } finally {
      setFollowLoading(false)
    }
  }

  useEffect(() => {
    if (token && brandId) {
      checkFollowingStatus()
    } else {
      setIsFollowing(false)
    }
  }, [token, brandId, checkFollowingStatus])

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      setCurrentPage((p) => p + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      setCurrentPage((p) => p - 1)
    }
  }

  void handleNextPage
  void handlePreviousPage

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
    containerBg: isDarkMode ? "#0f172a" : "#f5f5f5",
    text: isDarkMode ? "#f1f5f9" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1e293b" : Colors.white,
    cardBorder: isDarkMode ? "#334155" : "#e2e8f0",
  }

  const brandLogo = getBrandLogo()

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.containerBg }]}
    >
      {/* Custom Header with Brand Info */}
      <ImageBackground
        source={{
          uri: "https://mms.img.susercontent.com/ph-11134210-81ztm-mlh54hxutfya0b@resize_bs700x700",
        }}
        style={[styles.customHeader, { paddingTop: insets.top }]}
        contentFit="cover"
        transition={200}
      >
        <View style={styles.headerOverlay} />

        {/* Top Row: Back, Search, Filter */}
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={onBack} style={styles.backIconButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.searchWrapper}>
            <Ionicons
              name="search-outline"
              size={16}
              color="rgba(255, 255, 255, 0.7)"
              style={styles.searchIconLeft}
            />
            <TextInput
              style={[styles.searchInput, { color: Colors.white }]}
              placeholder="Search products in this brand"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Menu Modal */}
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
            <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleShareBrand}>
                <Ionicons
                  name="share-social"
                  size={18}
                  color={Colors.sky}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>Share Brand</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleReportBrand}>
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

        {/* Bottom Row: Brand Info and Follow Button */}
        <View style={styles.headerContent}>
          <View style={styles.brandHeaderContent}>
            <View style={[styles.brandLogoHeader, { borderColor: "#cbd5e1" }]}>
              {brandLogo ? (
                <Image
                  source={{ uri: brandLogo }}
                  style={styles.brandLogoImageHeader}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={styles.brandLogoFallbackHeader}>
                  <Text style={styles.brandInitialHeader}>
                    {getBrandInitial()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.brandHeaderText}>
              <Text style={styles.brandHeaderLabel} numberOfLines={1}>
                Official Brand Store
              </Text>
              <View style={styles.brandNameRow}>
                <Text
                  style={[styles.brandHeaderName, { color: Colors.white }]}
                  numberOfLines={1}
                >
                  {brand?.name ?? "Brand"}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.sky}
                  style={{ marginLeft: 4 }}
                />
              </View>
              {brand?.supplier_name ? (
                <Text
                  style={[styles.brandHeaderSupplier, { color: "#e2e8f0" }]}
                  numberOfLines={1}
                >
                  {brand.supplier_name}
                </Text>
              ) : null}
              {brand?.tagline ? (
                <Text
                  style={[styles.brandHeaderTagline, { color: "#e2e8f0" }]}
                  numberOfLines={1}
                >
                  {brand.tagline}
                </Text>
              ) : null}
              <View style={styles.brandMetaRow}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text
                  style={[styles.brandHeaderProducts, { color: Colors.white }]}
                  numberOfLines={1}
                >
                  4.8
                </Text>
                <Text style={[styles.brandMetaDot, { color: "#cbd5e1" }]}>•</Text>
                <Ionicons name="people" size={12} color={Colors.sky} />
                <Text
                  style={[styles.brandHeaderProducts, { color: Colors.white }]}
                  numberOfLines={1}
                >
                  12.5K followers
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleFollowPress}
            disabled={followLoading}
            style={[
              styles.topFollowButton,
              { backgroundColor: isFollowing ? "#0369a1" : Colors.sky },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFollowing ? "heart" : "heart-outline"}
              size={16}
              color={Colors.white}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.topFollowButtonText, { color: Colors.white }]}>
              {followLoading ? "Follow" : isFollowing ? "Followed" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {(["home", "products", "categories"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {selectedTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: Colors.sky }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ImageBackground>

      {selectedTab === "home" && (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <ShopByBrandHomeScreen
            products={products as any}
            token={token}
            isDarkMode={isDarkMode}
            onProductPress={onProductPress}
            wishlistItems={wishlistItems}
            onWishlistChange={onWishlistChange}
            loading={loading && !refreshing}
            onSeeMore={() => setSelectedTab("products")}
          />
        </ScrollView>
      )}

      {selectedTab === "products" && (
        <ShopByBrandProductsScreen
          token={token}
          brandId={brandId}
          isZqBrand={isZqBrand}
          searchQuery={searchQuery}
          wishlistItems={wishlistItems}
          onWishlistChange={onWishlistChange}
          onProductPress={onProductPress}
          isDarkMode={isDarkMode}
        />
      )}

      {selectedTab === "categories" && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ShopByBrandCategoriesScreen
            categories={categories}
            isDarkMode={isDarkMode}
            onCategoryPress={(categoryId) => setSelectedCategoryId(categoryId)}
          />
        </ScrollView>
      )}
    </View>
  )
}
