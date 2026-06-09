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
  RefreshControl,
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import { FlashList, FlashListRef } from "@shopify/flash-list"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { Product } from "../services/productService"
import ItemCard from "../components/Items/ItemCard"
import AppHeader from "../components/AppHeader/AppHeader"
import { useOptimizedProducts } from "../hooks/useOptimizedProducts"
import { ChatBotIcon } from "../components/ChatBot"
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
  user,
  cartCount = 0,
  roomId = null,
  categoryId = null,
  brandId = null,
  categories = [],
  brands = [],
  onProductPress = () => {},
  onCartPress = () => {},
  onOpenSearch = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
  onWishlistToggle,
  isDarkMode = false,
}: ShopScreenProps) {
  const shopScreenLoadStartRef = useRef(Date.now())
  const flashListRef = useRef<FlashListRef<Product>>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const lastScrollOffsetRef = useRef(0)

  // Refs to preserve filter state across navigation
  const filterStateRef = useRef({
    roomId: roomId || null,
    categoryId: categoryId || null,
    brandId: brandId || null,
    sort: "Relevant",
    price: "All",
  })

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#334155" : "#e5e7eb",
    card: isDarkMode ? "#1e293b" : Colors.white,
  }

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(() => {
    if (roomId !== null && roomId !== undefined) {
      filterStateRef.current.roomId = roomId
      return roomId
    }
    return filterStateRef.current.roomId
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    () => {
      if (categoryId !== null && categoryId !== undefined) {
        filterStateRef.current.categoryId = categoryId
        return categoryId
      }
      return filterStateRef.current.categoryId
    }
  )
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(() => {
    if (brandId !== null && brandId !== undefined) {
      filterStateRef.current.brandId = brandId
      return brandId
    }
    return filterStateRef.current.brandId
  })
  const [selectedSort, setSelectedSort] = useState(
    () => filterStateRef.current.sort
  )
  const [selectedPrice, setSelectedPrice] = useState<any>(
    () => filterStateRef.current.price
  )
  const prevPropsRef = useRef({ roomId, categoryId, brandId })

  // Sync incoming props to local state when props change (only from parent navigation)
  useEffect(() => {
    if (
      roomId !== null &&
      roomId !== undefined &&
      roomId !== prevPropsRef.current.roomId
    ) {
      filterStateRef.current.roomId = roomId
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
      filterStateRef.current.categoryId = categoryId
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
      filterStateRef.current.brandId = brandId
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
    filterStateRef.current.roomId = roomId
    setSelectedRoomId(roomId)
    console.log(`🏠 Room filter changed to: ${roomId}`)
  }, [])

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    filterStateRef.current.categoryId = categoryId
    setSelectedCategoryId(categoryId)
    console.log(`📂 Category filter changed to: ${categoryId}`)
  }, [])

  const handleBrandSelect = useCallback((brandId: number | null) => {
    filterStateRef.current.brandId = brandId
    setSelectedBrandId(brandId)
    console.log(`🏷️ Brand filter changed to: ${brandId}`)
  }, [])

  const handleSortSelect = useCallback((sort: string) => {
    filterStateRef.current.sort = sort
    setSelectedSort(sort)
    console.log(`Sort filter changed to: ${sort}`)
  }, [])

  const handlePriceSelect = useCallback((price: any) => {
    filterStateRef.current.price = price
    setSelectedPrice(price)
    console.log(`Price filter changed to:`, price)
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

    if (list.length > 0) {
      const loadTime = Date.now() - shopScreenLoadStartRef.current
      console.log(
        `⚡ ShopScreen READY: ${list.length} products (${data?.pages?.length ?? 0} pages) loaded in ${loadTime}ms`
      )
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
              resizeMode="contain"
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
        <AppHeader
          user={user}
          cartCount={cartCount}
          isDarkMode={isDarkMode}
          onCartPress={onCartPress}
          onCameraPress={() => console.log("Camera pressed")}
          onSearchPress={onOpenSearch}
          onProfilePress={() => console.log("Profile pressed")}
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
          showScrollToTop={showScrollToTop}
          onScrollToTop={handleScrollToTop}
          onRoomFilterChange={(filterType, value) => {
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

        <FlashList
          ref={flashListRef}
          masonry
          numColumns={2}
          data={products}
          renderItem={renderItem}
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

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}

export default memo(ShopScreen)
