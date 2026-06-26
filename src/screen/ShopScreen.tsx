import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react"
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import { Image } from "expo-image"
import { FlashList, FlashListRef } from "@shopify/flash-list"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { getColors } from "../theme/theme"
import { Product } from "../services/productService"
import ItemCard from "../components/Items/ItemCard"
import ShopHeader from "../components/ShopHeader/ShopHeader"
import HeaderFilter from "../components/AppHeader/HeaderFilter"
import { useOptimizedProducts } from "../hooks/useOptimizedProducts"
import styles from "../styles/ShopScreen.styles"

const ROOMS = [
  { room_id: 1, slug: "bedroom", room_name: "Bedroom" },
  { room_id: 2, slug: "kitchen", room_name: "Kitchen" },
  { room_id: 3, slug: "living-room", room_name: "Living Room" },
  { room_id: 4, slug: "outdoor", room_name: "Outdoor" },
  { room_id: 5, slug: "study-office-room", room_name: "Study & Office" },
  { room_id: 6, slug: "dining-room", room_name: "Dining Room" },
  { room_id: 7, slug: "laundry-room", room_name: "Laundry Room" },
  { room_id: 8, slug: "bathroom", room_name: "Bathroom" },
]

interface ShopScreenProps {
  token?: string | null
  user?: any
  cartCount?: number
  roomId?: number | null
  categoryId?: number | null
  brandId?: number | null
  categories?: any[]
  brands?: any[]
  onBack?: () => void
  onProductPress?: (id: number) => void
  onCartPress?: () => void
  onOpenSearch?: () => void
  onWishlistPress?: () => void
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onWishlistToggle?: (
    productId: number,
    isWishlisted: boolean,
    productData?: any
  ) => void
  isDarkMode?: boolean
}

function ShopScreen({
  token,
  cartCount = 0,
  roomId = null,
  categoryId = null,
  brandId = null,
  categories = [],
  brands = [],
  onProductPress = () => {},
  onCartPress = () => {},
  onOpenSearch = () => {},
  onWishlistPress,
  wishlistItems = [],
  onWishlistChange = () => {},
  onWishlistToggle,
  isDarkMode = false,
}: ShopScreenProps) {
  const flashListRef = useRef<FlashListRef<Product>>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const lastScrollOffsetRef = useRef(0)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(true)

  // Palette from the centralized theme (slate spine + sky accent). Memoized on
  // isDarkMode so the render callbacks that depend on `colors` stay stable.
  const colors = useMemo(() => {
    const t = getColors(isDarkMode)
    return {
      bg: t.bgSubtle,
      text: t.text,
      textSec: t.textSecondary,
      border: t.border,
      card: t.card,
      toolbar: t.card,
    }
  }, [isDarkMode])

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    roomId ?? null
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    categoryId ?? null
  )
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(
    brandId ?? null
  )
  const [selectedSort, setSelectedSort] = useState("Relevant")
  const [selectedPrice, setSelectedPrice] = useState<any>("All")
  const prevPropsRef = useRef({ roomId, categoryId, brandId })

  // Sync incoming props to local state when props change (only from parent navigation)
  useEffect(() => {
    if (
      roomId !== null &&
      roomId !== undefined &&
      roomId !== prevPropsRef.current.roomId
    ) {
      setSelectedRoomId(roomId)
      prevPropsRef.current.roomId = roomId
    }
  }, [roomId])

  useEffect(() => {
    if (
      categoryId !== null &&
      categoryId !== undefined &&
      categoryId !== prevPropsRef.current.categoryId
    ) {
      setSelectedCategoryId(categoryId)
      prevPropsRef.current.categoryId = categoryId
    }
  }, [categoryId])

  useEffect(() => {
    if (
      brandId !== null &&
      brandId !== undefined &&
      brandId !== prevPropsRef.current.brandId
    ) {
      setSelectedBrandId(brandId)
      prevPropsRef.current.brandId = brandId
    }
  }, [brandId])

  const selectedRoom = useMemo(
    () =>
      selectedRoomId ? ROOMS.find((r) => r.room_id === selectedRoomId) : null,
    [selectedRoomId]
  )

  // Map frontend sorts to backend sorts
  const backendSort = useMemo(() => {
    if (selectedSort === "Relevant") return "random"
    if (selectedSort === "A-Z") return null // Backend doesn't support A-Z, frontend only
    if (selectedSort === "Z-A") return null // Backend doesn't support Z-A, frontend only
    if (selectedSort === "Price: Low") return "price_asc"
    if (selectedSort === "Price: High") return "price_desc"
    if (selectedSort === "Newest") return "newest"
    return null
  }, [selectedSort])

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useOptimizedProducts({
    token,
    roomId: selectedRoomId,
    categoryId: selectedCategoryId,
    brandId: selectedBrandId,
    sortBy: backendSort,
  })

  // Scroll to top when filters change (not when paginating)
  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      flashListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }, 50)
    return () => clearTimeout(scrollTimeout)
  }, [selectedRoomId, selectedCategoryId, selectedBrandId])

  const handleRoomSelect = useCallback((roomId: number | null) => {
    setSelectedRoomId(roomId)
  }, [])

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId)
  }, [])

  const handleBrandSelect = useCallback((brandId: number | null) => {
    setSelectedBrandId(brandId)
  }, [])

  const handleSortSelect = useCallback((sort: string) => {
    setSelectedSort(sort)
  }, [])

  const handlePriceSelect = useCallback((price: any) => {
    setSelectedPrice(price)
  }, [])

  // Flatten every loaded page into a single list, then apply the price filter
  const products = useMemo(() => {
    let list: Product[] = data?.pages?.flatMap((p) => p.products ?? []) ?? []

    if (selectedPrice && selectedPrice !== "All") {
      list = list.filter((product: Product) => {
        const price =
          product.priceMember ?? product.priceDp ?? product.priceSrp ?? 0
        switch (selectedPrice) {
          case "Under ₱5k":
            return price < 5000
          case "₱5k-₱20k":
            return price >= 5000 && price < 20000
          case "₱20k-₱50k":
            return price >= 20000 && price < 50000
          case "Over ₱50k":
            return price >= 50000
          default:
            if (
              typeof selectedPrice === "object" &&
              selectedPrice.min !== undefined
            ) {
              const min = selectedPrice.min || 0
              const max = selectedPrice.max || Infinity
              return price >= min && price <= max
            }
            return true
        }
      })
    }

    return list
  }, [data?.pages, selectedPrice])

  // Restore scroll position when products are available
  useEffect(() => {
    if (products.length === 0) return
    if (lastScrollOffsetRef.current > 0) {
      const restoreTimeout = setTimeout(() => {
        try {
          flashListRef.current?.scrollToOffset({
            offset: lastScrollOffsetRef.current,
            animated: false,
          })
        } catch (error) {
          console.log("Scroll restore error:", error)
        }
      }, 100)
      return () => clearTimeout(restoreTimeout)
    }
  }, [products])

  const total = useMemo(() => {
    if (!data?.pages?.length) return 0
    return data.pages[data.pages.length - 1]?.total ?? 0
  }, [data])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y
      lastScrollOffsetRef.current = scrollY
      setShowScrollToTop(scrollY > 300)
    },
    []
  )

  const handleScrollToTop = useCallback(() => {
    flashListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [])

  // The core of "proper" pagination: fetch the next page only when one exists
  // and we aren't already fetching it.
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("📥 onEndReached → fetching next page")
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const wishlistItem = wishlistItems?.find((w) => w.product.id === item.id)
      const productCard = {
        id: item.id,
        name: item.name,
        image: item.image,
        soldCount: item.soldCount,
        originalPrice: item.priceSrp,
        memberPrice: item.priceMember,
        pv: item.prodpv,
        brandName: item.brand,
        avgRating: item.avgRating,
        qty: item.qty,
        variantCount: item.variants?.length ?? 0,
        categoryId: item.catid,
        brandId: item.brandType,
        badges: {
          musthave: item.musthave,
          bestseller: item.bestseller,
          salespromo: item.salespromo,
        },
      }

      return (
        <View style={styles.gridItem}>
          <ItemCard
            product={productCard}
            token={token}
            isDarkMode={isDarkMode}
            onPress={(product) => onProductPress(product.id)}
            isWishlisted={!!wishlistItem}
            wishlistId={wishlistItem?.wishlist_id}
            onWishlistToggle={onWishlistToggle || (() => onWishlistChange())}
          />
        </View>
      )
    },
    [
      wishlistItems,
      token,
      isDarkMode,
      onProductPress,
      onWishlistChange,
      onWishlistToggle,
    ]
  )

  const renderListItem = useCallback(
    ({ item }: { item: Product }) => {
      const wishlistItem = wishlistItems?.find((w) => w.product.id === item.id)
      const price = item.priceMember ?? item.priceDp ?? item.priceSrp ?? 0
      const srp = item.priceSrp ?? 0
      const hasDiscount = price > 0 && srp > price
      const discountPct = hasDiscount ? Math.round(((srp - price) / srp) * 100) : 0
      const badge = item.musthave
        ? { label: "Must Have", color: "#f97316" }
        : item.bestseller
        ? { label: "Bestseller", color: "#d4a017" }
        : item.salespromo
        ? { label: "On Sale", color: "#10b981" }
        : null

      return (
        <Pressable
          onPress={() => onProductPress(item.id)}
          style={[
            styles.listRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          android_ripple={{ color: "rgba(0,0,0,0.04)" }}
        >
          <View style={[styles.listRowThumb, { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" }]}>
            <Image
              source={{ uri: item.image }}
              style={styles.listRowImg}
              contentFit="cover"
              transition={200}
            />
            {hasDiscount && (
              <View style={styles.listRowDiscount}>
                <Text style={styles.listRowDiscountText}>{discountPct}%</Text>
              </View>
            )}
          </View>
          <View style={styles.listRowDetails}>
            {badge && (
              <View style={[styles.listRowBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.listRowBadgeText}>{badge.label}</Text>
              </View>
            )}
            <Text style={[styles.listRowName, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            {!!item.brand && (
              <Text style={[styles.listRowBrandText, { color: colors.textSec }]} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
            <View style={styles.listRowPriceRow}>
              <Text style={styles.listRowPrice}>₱{price.toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={[styles.listRowSrp, { color: colors.textSec }]}>
                  ₱{srp.toLocaleString()}
                </Text>
              )}
            </View>
            {!!item.prodpv && (
              <Text style={[styles.listRowPv, { color: colors.textSec }]}>
                PV: {item.prodpv}
              </Text>
            )}
          </View>
          <View style={styles.listRowWishlistArea}>
            <Ionicons
              name={wishlistItem ? "heart" : "heart-outline"}
              size={20}
              color={wishlistItem ? "#ef4444" : colors.textSec}
            />
          </View>
        </Pressable>
      )
    },
    [wishlistItems, isDarkMode, onProductPress, colors]
  )

  const keyExtractor = useCallback(
    (item: Product, index: number) => `${item.id}-${index}`,
    []
  )

  const renderLoadingPlaceholders = useCallback(() => {
    const dummyProducts = Array.from({ length: 6 }, (_, i) => i)
    const leftColumn = dummyProducts.filter((i) => i % 2 === 0)
    const rightColumn = dummyProducts.filter((i) => i % 2 !== 0)

    const renderDummyCard = (id: number) => (
      <View key={`loading-${id}`} style={styles.gridItem}>
        <View
          style={[
            styles.dummyCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.dummyImageContainer,
              { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" },
            ]}
          >
            <Image
              source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png"
            }}
              style={styles.dummyImage}
              contentFit="contain"
              transition={200}
              tintColor={isDarkMode ? "#cbd5e1" : "#4b5563"}
            />
          </View>
          <View style={styles.dummyContent}>
            <View
              style={[
                styles.dummyLine,
                { backgroundColor: isDarkMode ? "#334155" : "#e5e7eb" },
              ]}
            />
            <View
              style={[
                styles.dummyLine,
                {
                  backgroundColor: isDarkMode ? "#334155" : "#e5e7eb",
                  width: "70%",
                },
              ]}
            />
            <View
              style={[
                styles.dummyLine,
                {
                  backgroundColor: isDarkMode ? "#334155" : "#e5e7eb",
                  width: "50%",
                  marginTop: 8,
                },
              ]}
            />
          </View>
        </View>
      </View>
    )

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {leftColumn.map((id) => renderDummyCard(id))}
        </View>
        <View style={styles.masonryColumn}>
          {rightColumn.map((id) => renderDummyCard(id))}
        </View>
      </View>
    )
  }, [colors.card, colors.border, isDarkMode])

  const renderEmpty = useCallback(() => {
    if (isLoading) return renderLoadingPlaceholders()
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="cube-outline" size={48} color={colors.textSec} />
        <Text style={[styles.emptyText, { color: colors.textSec }]}>
          No products found
        </Text>
      </View>
    )
  }, [isLoading, renderLoadingPlaceholders, colors.bg, colors.textSec])

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="small" color={Colors.sky} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading more products...
        </Text>
      </View>
    )
  }, [isFetchingNextPage, colors.bg, colors.text])

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bg }]}
        edges={[]}
      >
        <ShopHeader
          cartCount={cartCount}
          wishlistCount={wishlistItems?.length ?? 0}
          isDarkMode={isDarkMode}
          filterActive={showFilters}
          onSearchPress={onOpenSearch}
          onCartPress={onCartPress}
          onWishlistPress={onWishlistPress}
          onFilterPress={() => setShowFilters((v) => !v)}
        />

        {showFilters && (
          <HeaderFilter
            showRoomFilter={true}
            selectedRoom={selectedRoom?.room_name || "All Room Types"}
            showCategoryFilter={true}
            selectedCategory={
              selectedCategoryId
                ? categories.find((c) => c.id === selectedCategoryId)?.name
                : "All Categories"
            }
            categories={categories}
            showBrandFilter={true}
            selectedBrand={
              selectedBrandId
                ? brands.find((b) => b.id === selectedBrandId)?.name
                : "All Brands"
            }
            brands={brands}
            isDarkMode={isDarkMode}
            showScrollToTop={showScrollToTop}
            onScrollToTop={handleScrollToTop}
            onFilterChange={(filterType, value) => {
              if (filterType === "room") {
                handleRoomSelect(
                  value === "All Room Types"
                    ? null
                    : ROOMS.find((r) => r.room_name === value)?.room_id || null
                )
              }
              if (filterType === "category") {
                handleCategorySelect(value || null)
              }
              if (filterType === "brand") {
                handleBrandSelect(value || null)
              }
              if (filterType === "sort") {
                handleSortSelect(value)
              }
              if (filterType === "price") {
                handlePriceSelect(value)
              }
            }}
          />
        )}

        {/* View-mode toolbar */}
        <View
          style={[
            styles.viewToolbar,
            {
              backgroundColor: colors.toolbar,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.viewToolbarCount, { color: colors.textSec }]}>
            {products.length > 0 ? `${total} Products` : ""}
          </Text>
          <View style={[styles.viewToggleGroup, { borderColor: colors.border }]}>
            <Pressable
              style={[
                styles.viewModeBtn,
                viewMode === "grid" && { backgroundColor: Colors.sky },
              ]}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === "grid" ? Colors.white : colors.textSec}
              />
            </Pressable>
            <Pressable
              style={[
                styles.viewModeBtn,
                viewMode === "list" && { backgroundColor: Colors.sky },
              ]}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === "list" ? Colors.white : colors.textSec}
              />
            </Pressable>
          </View>
        </View>

        <FlashList
            key={viewMode}
            ref={flashListRef}
            masonry={viewMode === "grid"}
            numColumns={viewMode === "grid" ? 2 : 1}
            data={products}
            renderItem={viewMode === "grid" ? renderItem : renderListItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={isDarkMode ? "#fff" : Colors.sky}
              />
            }
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
          />
      </SafeAreaView>

    </View>
  )
}

export default memo(ShopScreen)
