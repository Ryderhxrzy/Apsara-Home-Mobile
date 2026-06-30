// @ts-nocheck
import React, { useCallback, useMemo, useState, memo } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native"
import { Image } from "expo-image"
import { FlashList } from "@shopify/flash-list"

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList)
import Ionicons from "../../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"
import ItemCard from "../../components/Items/ItemCard"
import {
  useInfiniteBrandProducts,
  type BrandProduct,
} from "../../hooks/query/useInfiniteBrandProducts"
import axios from "axios"
import { API_CONFIG } from "../../config/api"
import Toast from "react-native-toast-message"

// ─── Sort options ────────────────────────────────────────────────────────────

type SortKey = "default" | "name_asc" | "name_desc" | "price_asc" | "price_desc"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

// ─── List-mode row card ──────────────────────────────────────────────────────

interface ListRowProps {
  item: BrandProduct
  token?: string | null
  isDarkMode?: boolean
  isWishlisted: boolean
  wishlistId?: number
  onPress: () => void
  onWishlistToggle: () => void
  colors: ReturnType<typeof buildColors>
}

const ListRow = memo(function ListRow({
  item,
  token,
  isDarkMode,
  isWishlisted: initialWishlisted,
  wishlistId,
  onPress,
  onWishlistToggle,
  colors,
}: ListRowProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [toggling, setToggling] = useState(false)

  const price = item.memberPrice ?? item.priceMember ?? item.priceSrp ?? 0
  const srp = item.originalPrice ?? item.priceSrp ?? 0
  const hasDiscount = price > 0 && srp > price
  const discountPct = hasDiscount ? Math.round(((srp - price) / srp) * 100) : 0

  const badges = []
  if (item.musthave) badges.push({ label: "Must Have", color: "#f97316" })
  else if (item.bestseller)
    badges.push({ label: "Bestseller", color: "#d4a017" })
  else if (item.salespromo) badges.push({ label: "On Sale", color: "#10b981" })

  const handleWishlist = async () => {
    if (!token || toggling) return
    setToggling(true)
    const prev = wishlisted
    setWishlisted(!prev)
    try {
      if (prev) {
        await axios.delete(`${API_CONFIG.BASE_URL}/wishlist/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(
          `${API_CONFIG.BASE_URL}/wishlist`,
          { product_id: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      onWishlistToggle()
    } catch {
      setWishlisted(prev)
      Toast.show({ type: "error", text1: "Wishlist update failed" })
    } finally {
      setToggling(false)
    }
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.listRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      android_ripple={{ color: "rgba(0,0,0,0.04)" }}
    >
      {/* Thumbnail */}
      <View style={[styles.listRowThumb, { backgroundColor: colors.imageBg }]}>
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

      {/* Details */}
      <View style={styles.listRowDetails}>
        {badges.length > 0 && (
          <View
            style={[styles.listRowBadge, { backgroundColor: badges[0].color }]}
          >
            <Text style={styles.listRowBadgeText}>{badges[0].label}</Text>
          </View>
        )}
        <Text
          style={[styles.listRowName, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {!!item.brand && (
          <Text
            style={[styles.listRowBrand, { color: colors.textSec }]}
            numberOfLines={1}
          >
            {item.brand}
          </Text>
        )}
        <View style={styles.listRowPriceRow}>
          <Text style={[styles.listRowPrice, { color: Colors.sky }]}>
            ₱{price.toLocaleString()}
          </Text>
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

      {/* Wishlist */}
      <Pressable
        onPress={handleWishlist}
        hitSlop={8}
        style={styles.listRowWishlist}
      >
        <Ionicons
          name={wishlisted ? "heart" : "heart-outline"}
          size={20}
          color={wishlisted ? "#ef4444" : colors.textSec}
        />
      </Pressable>
    </Pressable>
  )
})

// ─── Skeleton placeholders ───────────────────────────────────────────────────

function GridSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const bg = isDarkMode ? "#1e293b" : Colors.white
  const border = isDarkMode ? "#334155" : "#e2e8f0"
  const shimmer = isDarkMode ? "#334155" : "#e5e7eb"
  const imgBg = isDarkMode ? "#0f172a" : "#f1f5f9"

  return (
    <View
      style={[
        styles.skeletonGrid,
        { borderColor: border, backgroundColor: bg },
      ]}
    >
      <View style={[styles.skeletonImg, { backgroundColor: imgBg }]}>
        <Image
          source={{
            uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png",
          }}
          style={styles.skeletonLogo}
          contentFit="contain"
          tintColor={isDarkMode ? "#cbd5e1" : "#4b5563"}
        />
      </View>
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { backgroundColor: shimmer }]} />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: shimmer, width: "70%" },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: shimmer, width: "50%", marginTop: 6 },
          ]}
        />
      </View>
    </View>
  )
}

function ListSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const bg = isDarkMode ? "#1e293b" : Colors.white
  const border = isDarkMode ? "#334155" : "#e2e8f0"
  const shimmer = isDarkMode ? "#334155" : "#e5e7eb"
  const imgBg = isDarkMode ? "#0f172a" : "#f1f5f9"
  return (
    <View
      style={[
        styles.listSkeletonRow,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View style={[styles.listSkeletonImg, { backgroundColor: imgBg }]} />
      <View style={styles.listSkeletonLines}>
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: shimmer, width: "80%" },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: shimmer, width: "50%", marginTop: 6 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: shimmer, width: "40%", marginTop: 6 },
          ]}
        />
      </View>
    </View>
  )
}

// ─── Color builder ───────────────────────────────────────────────────────────

function buildColors(isDarkMode: boolean) {
  return {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    card: isDarkMode ? "#1e293b" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#334155" : "#e2e8f0",
    imageBg: isDarkMode ? "#0f172a" : "#f1f5f9",
    toolbar: isDarkMode ? "#1e293b" : Colors.white,
    toolbarBorder: isDarkMode ? "#334155" : "#e5e7eb",
    modalBg: isDarkMode ? "#1e293b" : Colors.white,
    activeBtn: Colors.sky,
  }
}

// ─── Main screen ─────────────────────────────────────────────────────────────

interface ShopByBrandProductsScreenProps {
  token?: string | null
  brandId?: number
  isZqBrand?: boolean
  categoryId?: number | null
  searchQuery?: string
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onProductPress?: (id: number) => void
  isDarkMode?: boolean
  // Brand header rendered at the top of the list (scrolls away) + scroll wiring
  // so the parent can collapse it into the compact bar.
  header?: React.ReactNode
  onScroll?: (e: any) => void
  listRef?: React.Ref<any>
}

export default function ShopByBrandProductsScreen({
  token,
  brandId,
  isZqBrand = false,
  categoryId = null,
  searchQuery = "",
  wishlistItems = [],
  onWishlistChange = () => {},
  onProductPress = () => {},
  isDarkMode = false,
  header = null,
  onScroll,
  listRef,
}: ShopByBrandProductsScreenProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortKey>("default")
  const [showSortModal, setShowSortModal] = useState(false)

  const colors = useMemo(() => buildColors(isDarkMode), [isDarkMode])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isRefetching,
    refetch,
    isError,
  } = useInfiniteBrandProducts({
    token,
    brandId,
    isZqBrand,
    perPage: 16,
    categoryId,
    search: searchQuery,
  })

  const total = data?.pages[0]?.total ?? 0

  const sortedProducts = useMemo<BrandProduct[]>(() => {
    const flat = data?.pages.flatMap((p) => p.products) ?? []
    switch (sortBy) {
      case "name_asc":
        return [...flat].sort((a, b) => a.name.localeCompare(b.name))
      case "name_desc":
        return [...flat].sort((a, b) => b.name.localeCompare(a.name))
      case "price_asc":
        return [...flat].sort(
          (a, b) =>
            (a.memberPrice ?? a.priceSrp ?? 0) -
            (b.memberPrice ?? b.priceSrp ?? 0)
        )
      case "price_desc":
        return [...flat].sort(
          (a, b) =>
            (b.memberPrice ?? b.priceSrp ?? 0) -
            (a.memberPrice ?? a.priceSrp ?? 0)
        )
      default:
        return flat
    }
  }, [data?.pages, sortBy])

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Default"

  // ── Render items ────────────────────────────────────────────────────────

  const renderGridItem = useCallback(
    ({ item }: { item: BrandProduct }) => {
      const wishlistItem = wishlistItems?.find((w) => w.product?.id === item.id)
      const productCard = {
        id: item.id,
        name: item.name,
        image: item.image,
        soldCount: item.soldCount || 0,
        originalPrice: item.originalPrice ?? item.priceSrp,
        memberPrice: item.memberPrice ?? item.priceMember,
        pv: item.prodpv,
        brandName: item.brand,
        variantCount: (item.variants as any[])?.length ?? 0,
        badges: {
          musthave: item.musthave,
          bestseller: item.bestseller,
          salespromo: item.salespromo,
        },
      }
      return (
        <View style={styles.gridItemWrap}>
          <ItemCard
            product={productCard}
            token={token}
            isDarkMode={isDarkMode}
            onPress={(p) => onProductPress(p.id)}
            isWishlisted={!!wishlistItem}
            wishlistId={wishlistItem?.wishlist_id}
            onWishlistToggle={onWishlistChange}
          />
        </View>
      )
    },
    [token, isDarkMode, wishlistItems, onProductPress, onWishlistChange]
  )

  const renderListItem = useCallback(
    ({ item }: { item: BrandProduct }) => {
      const wishlistItem = wishlistItems?.find((w) => w.product?.id === item.id)
      return (
        <ListRow
          item={item}
          token={token}
          isDarkMode={isDarkMode}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onPress={() => onProductPress(item.id)}
          onWishlistToggle={onWishlistChange}
          colors={colors}
        />
      )
    },
    [token, isDarkMode, wishlistItems, onProductPress, onWishlistChange, colors]
  )

  const keyExtractor = useCallback(
    (item: BrandProduct, index: number) => `${item.id}-${index}`,
    []
  )

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Footer ──────────────────────────────────────────────────────────────

  const ListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.sky} />
        <Text style={[styles.footerText, { color: colors.textSec }]}>
          Loading more...
        </Text>
      </View>
    )
  }, [isFetchingNextPage, colors.textSec])

  // ── Empty / skeleton ─────────────────────────────────────────────────────

  const ListEmpty = useCallback(() => {
    if (isLoading) {
      const slots = [0, 1, 2, 3, 4, 5]
      if (viewMode === "grid") {
        return (
          <View style={styles.skeletonGridContainer}>
            {slots.map((i) => (
              <View key={i} style={styles.skeletonGridItem}>
                <GridSkeleton isDarkMode={isDarkMode} />
              </View>
            ))}
          </View>
        )
      }
      return (
        <View style={styles.skeletonListContainer}>
          {slots.map((i) => (
            <ListSkeleton key={i} isDarkMode={isDarkMode} />
          ))}
        </View>
      )
    }
    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textSec}
          />
          <Text style={[styles.emptyText, { color: colors.textSec }]}>
            Failed to load products
          </Text>
          <Pressable
            style={[styles.retryBtn, { borderColor: Colors.sky }]}
            onPress={() => refetch()}
          >
            <Text
              style={{ color: Colors.sky, fontWeight: "600", fontSize: 13 }}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      )
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color={colors.textSec} />
        <Text style={[styles.emptyText, { color: colors.textSec }]}>
          No products found
        </Text>
      </View>
    )
  }, [isLoading, isError, viewMode, isDarkMode, colors.textSec, refetch])

  // Brand header (passed from parent) + the sort/view toolbar, both rendered at
  // the top of the list so they scroll away with the content.
  const listHeader = (
    <>
      {header}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.toolbar,
            borderBottomColor: colors.toolbarBorder,
          },
        ]}
      >
        {/* Sort button */}
        <Pressable
          style={[styles.sortBtn, { borderColor: colors.border }]}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={14} color={Colors.sky} />
          <Text
            style={[styles.sortBtnText, { color: Colors.sky }]}
            numberOfLines={1}
          >
            {currentSortLabel}
          </Text>
          <Ionicons name="chevron-down" size={12} color={Colors.sky} />
        </Pressable>

        {/* Count */}
        <Text style={[styles.countText, { color: colors.textSec }]}>
          {total > 0 ? `${total} Products` : isLoading ? "Loading…" : ""}
        </Text>

        {/* View toggle */}
        <View style={[styles.viewToggle, { borderColor: colors.border }]}>
          <Pressable
            style={[
              styles.viewToggleBtn,
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
              styles.viewToggleBtn,
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
    </>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Product list (masonry grid / list) ── */}
      <AnimatedFlashList
        ref={listRef}
        key={viewMode}
        data={sortedProducts}
        masonry={viewMode === "grid"}
        numColumns={viewMode === "grid" ? 2 : 1}
        renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          sortedProducts.length === 0
            ? styles.listContentEmpty
            : styles.listContent
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDarkMode ? "#fff" : Colors.sky}
            colors={[Colors.sky]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Sort modal ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Sort By
              </Text>
              <Pressable onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSec} />
              </Pressable>
            </View>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.modalOption,
                  { borderBottomColor: colors.toolbarBorder },
                  sortBy === opt.value && { backgroundColor: "#e0f2fe" },
                ]}
                onPress={() => {
                  setSortBy(opt.value)
                  setShowSortModal(false)
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortBy === opt.value
                      ? { color: Colors.sky, fontWeight: "700" }
                      : { color: colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.value && (
                  <Ionicons name="checkmark" size={16} color={Colors.sky} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 170,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  countText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  viewToggleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  // List content — header is full-width; items carry their own insets.
  listContent: {
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  gridItemWrap: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },

  // List row card
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    marginHorizontal: 8,
  },
  listRowThumb: {
    width: 100,
    height: 100,
    flexShrink: 0,
    position: "relative",
  },
  listRowImg: {
    width: "100%",
    height: "100%",
  },
  listRowDiscount: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ef4444",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  listRowDiscountText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  listRowDetails: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  listRowBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  listRowBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  listRowName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  listRowBrand: {
    fontSize: 11,
    fontWeight: "500",
  },
  listRowPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  listRowPrice: {
    fontSize: 14,
    fontWeight: "800",
  },
  listRowSrp: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  listRowPv: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  listRowWishlist: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignSelf: "center",
  },

  // Footer loader
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  footerText: { fontSize: 13, fontWeight: "500" },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: { fontSize: 14, fontWeight: "500" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },

  // Skeleton grid
  skeletonGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
    gap: 8,
  },
  skeletonGridItem: { width: "48%" },
  skeletonGrid: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  skeletonImg: {
    width: "100%",
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonLogo: { width: "55%", height: "55%" },
  skeletonLines: { padding: 10, gap: 6 },
  skeletonLine: { height: 8, borderRadius: 4, width: "100%" },

  // Skeleton list
  skeletonListContainer: { gap: 8 },
  listSkeletonRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  listSkeletonImg: { width: 100, height: 90 },
  listSkeletonLines: {
    flex: 1,
    padding: 12,
    gap: 6,
    justifyContent: "center",
  },

  // Sort modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: { fontSize: 14 },
})
