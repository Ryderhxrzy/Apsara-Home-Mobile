import React from "react"
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native"
import { FlashList } from "@shopify/flash-list"
import SectionHeader from "../ui/SectionHeader"
import ItemCard from "../Items/ItemCard"
import { ItemCardSkeleton } from "../SkeletonLoader/SkeletonLoader"
import type { ProductCard } from "../../services/productService"

// Matches the ShopScreen product card (lighter than the old 220px FeaturedItems).
const CARD_W = 165

interface WishlistRef {
  product_id?: number
  id?: number
}

interface HomeProductRailProps {
  title: string
  icon: string
  /** Full list; the rail slices [offset, offset+limit) internally so the parent
   *  can pass a stable array reference (no re-render on unrelated home state). */
  products: ProductCard[]
  offset?: number
  limit?: number
  loading?: boolean
  token?: string | null
  isDarkMode?: boolean
  wishlistItems?: WishlistRef[]
  onProductPress?: (id: number) => void
  onWishlistChange?: () => void
  actionLabel?: string
  onAction?: () => void
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * Horizontal product rail for the home screen — a FlashList of the app's
 * standard ItemCard (same card as ShopScreen) at a fixed rail width. The loading
 * state uses ItemCardSkeleton in the same-width wrapper, so the placeholder and
 * the real card have identical dimensions. Memoized; slicing + the wishlist Set
 * are computed on stable inputs so banner ticks don't re-render the rail.
 */
function HomeProductRail({
  title,
  icon,
  products,
  offset = 0,
  limit,
  loading = false,
  token,
  isDarkMode = false,
  wishlistItems,
  onProductPress,
  onWishlistChange,
  actionLabel,
  onAction,
  containerStyle,
}: HomeProductRailProps) {
  const items =
    limit != null
      ? products.slice(offset, offset + limit)
      : products.slice(offset)

  // Nothing to show and not loading → render nothing (no empty section).
  if (items.length === 0 && !loading) return null

  const wishlistSet = new Set(
    (wishlistItems ?? []).map((w) => w.product_id ?? w.id).filter(Boolean)
  )

  return (
    <View style={containerStyle}>
      <SectionHeader
        title={title}
        icon={icon}
        isDarkMode={isDarkMode}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      {loading && items.length === 0 ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.card}>
              <ItemCardSkeleton imageHeight={200} isDarkMode={isDarkMode} />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `rail-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ItemCard
                product={item}
                token={token}
                isWishlisted={wishlistSet.has(item.id)}
                onPress={(p) => onProductPress?.(p.id)}
                onWishlistToggle={() => onWishlistChange?.()}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 12, paddingVertical: 4 },
  card: { width: CARD_W, marginRight: 12 },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
})

export default HomeProductRail
