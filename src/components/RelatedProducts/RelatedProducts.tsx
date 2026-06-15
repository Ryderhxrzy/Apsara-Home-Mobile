import React from "react"
import { View, Text, ScrollView } from "react-native"
import Ionicons from "../ui/Icon"
import FeaturedItems from "../Items/FeaturedItems"
import { Colors } from "../../constants/colors"
import type { ProductCard } from "../../services/productService"
import styles from "../../styles/ProductDetailScreen.styles"

interface WishlistRef {
  product_id: number
}

interface RelatedProductsProps {
  products: ProductCard[]
  loading?: boolean
  token?: string | null
  wishlistItems?: WishlistRef[]
  isDarkMode?: boolean
  onProductPress?: (id: number) => void
  onWishlistToggle?: (productId: number, isWishlisted: boolean) => void
}

/**
 * Horizontal "Related Products" rail. Extracted so it doesn't re-render with the
 * ProductDetailScreen on gallery swipes / variant changes (memoized on props).
 */
function RelatedProducts({
  products,
  loading = false,
  token,
  wishlistItems,
  isDarkMode = false,
  onProductPress,
  onWishlistToggle,
}: RelatedProductsProps) {
  const text = isDarkMode ? "#f8fafc" : "#1f2937"
  const textSec = isDarkMode ? "#94a3b8" : Colors.textSecondary
  const card = isDarkMode ? "#1e293b" : "#ffffff"
  const divider = isDarkMode ? "#334155" : "#f1f5f9"

  // Hide entirely while loading (avoids a "No related products found" flash on
  // every product open) and when there are genuinely none.
  if (products.length === 0) {
    if (loading) return null
    return (
      <View
        style={[
          styles.relatedSection,
          {
            backgroundColor: card,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 16,
          },
        ]}
      >
        <Text style={{ color: textSec, fontSize: 14 }}>
          No related products found
        </Text>
      </View>
    )
  }

  const wishlistSet = new Set((wishlistItems ?? []).map((w) => w.product_id))

  return (
    <View style={[styles.relatedSection, { backgroundColor: card }]}>
      <View style={[styles.relatedHeader, { borderBottomColor: divider }]}>
        <Ionicons name="grid-outline" size={15} color={Colors.sky} />
        <Text style={[styles.relatedTitle, { color: text }]}>
          Related Products
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.relatedScroll}
      >
        <View style={styles.relatedRow}>
          {products.map((p) => (
            <View key={p.id} style={styles.relatedCard}>
              <FeaturedItems
                product={
                  {
                    id: p.id,
                    name: p.name,
                    image: p.image,
                    price: p.memberPrice,
                    priceMember: p.memberPrice,
                    priceDp: p.memberPrice,
                    prodpv: p.pv,
                    original_price: p.originalPrice,
                    discounted_price: p.memberPrice,
                    musthave: p.badges?.musthave || false,
                    bestseller: p.badges?.bestseller || false,
                    salespromo: p.badges?.salespromo || false,
                  } as any
                }
                token={token}
                isWishlisted={wishlistSet.has(p.id)}
                onPress={(id) => onProductPress?.(id)}
                onWishlistToggle={onWishlistToggle as unknown as () => void}
                isDarkMode={isDarkMode}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default RelatedProducts
