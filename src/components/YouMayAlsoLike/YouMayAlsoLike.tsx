import React from "react"
import { View, Text } from "react-native"
import ItemCard from "../Items/ItemCard"
import type { ProductCard } from "../../services/productService"
import styles from "../../styles/ProductDetailScreen.styles"

interface WishlistRef {
  product_id: number
}

interface YouMayAlsoLikeProps {
  products: ProductCard[]
  visibleCount: number
  token?: string | null
  wishlistItems?: WishlistRef[]
  isDarkMode?: boolean
  onProductPress?: (id: number) => void
  onWishlistToggle?: (productId: number, isWishlisted: boolean) => void
}

/**
 * "You May Also Like" masonry grid. Extracted from ProductDetailScreen so the
 * (up to 20+) ItemCards don't re-render on every gallery swipe / variant change —
 * the component is memoized on its props (compiler), and the wishlist lookup is a
 * single O(1) Set instead of a `.some()` per card per render.
 */
function YouMayAlsoLike({
  products,
  visibleCount,
  token,
  wishlistItems,
  isDarkMode = false,
  onProductPress,
  onWishlistToggle,
}: YouMayAlsoLikeProps) {
  if (products.length === 0) return null

  const wishlistSet = new Set((wishlistItems ?? []).map((w) => w.product_id))
  const visible = products.slice(0, visibleCount)
  const left = visible.filter((_, i) => i % 2 === 0)
  const right = visible.filter((_, i) => i % 2 === 1)

  const renderCard = (p: ProductCard) => (
    <View key={p.id} style={styles.youMayAlsoLikeItem}>
      <ItemCard
        product={p}
        token={token}
        isWishlisted={wishlistSet.has(p.id)}
        onPress={(item) => onProductPress?.(item.id)}
        onWishlistToggle={onWishlistToggle}
        isDarkMode={isDarkMode}
      />
    </View>
  )

  const text = isDarkMode ? "#f8fafc" : "#1f2937"
  const card = isDarkMode ? "#1e293b" : "#ffffff"
  const divider = isDarkMode ? "#334155" : "#f1f5f9"

  return (
    <View style={[styles.youMayAlsoLikeSection, { backgroundColor: card }]}>
      <View
        style={[
          styles.youMayAlsoLikeHeader,
          { borderTopColor: divider, borderBottomColor: divider },
        ]}
      >
        <View
          style={[styles.youMayAlsoLikeBorder, { backgroundColor: divider }]}
        />
        <Text style={[styles.youMayAlsoLikeTitle, { color: text }]}>
          You May Also Like
        </Text>
        <View
          style={[styles.youMayAlsoLikeBorder, { backgroundColor: divider }]}
        />
      </View>
      <View style={styles.youMayAlsoLikeMasonryGrid}>
        <View style={styles.youMayAlsoLikeMasonryColumn}>
          {left.map(renderCard)}
        </View>
        <View style={styles.youMayAlsoLikeMasonryColumn}>
          {right.map(renderCard)}
        </View>
      </View>
    </View>
  )
}

export default YouMayAlsoLike
