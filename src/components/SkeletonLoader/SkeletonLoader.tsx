import React, { useState, useEffect } from "react"
import { View, StyleSheet, Dimensions, Animated, Easing } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

const SCREEN_WIDTH = Dimensions.get("window").width

interface SkeletonProps {
  width?: string | number
  height?: string | number
  style?: any
  borderRadius?: number
}

export function Skeleton({
  width = "100%",
  height = 20,
  style,
  borderRadius = 4,
}: SkeletonProps) {
  // Animated shimmer: a highlight band sweeps across the base block on the UI
  // thread (transform-only, useNativeDriver) and loops while mounted.
  const shimmer = useState(() => new Animated.Value(0))[0]
  const [layoutWidth, setLayoutWidth] = useState(0)

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    anim.start()
    return () => anim.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth, layoutWidth],
  })

  return (
    <View
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
      style={[
        { width, height, borderRadius, backgroundColor: "#e5e7eb" },
        styles.skeleton,
        style,
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={["#e5e7eb", "#f5f7fa", "#e5e7eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerFill}
        />
      </Animated.View>
    </View>
  )
}

export function BannerSkeleton() {
  return (
    <View style={styles.bannerSkeleton}>
      <Skeleton height={190} borderRadius={24} />
    </View>
  )
}

export function SectionHeaderSkeleton() {
  return (
    <View style={styles.sectionHeaderSkeleton}>
      <Skeleton width={120} height={20} />
      <View style={styles.sectionHeaderRight}>
        <Skeleton width={40} height={12} />
        <Skeleton width={16} height={16} borderRadius={8} />
      </View>
    </View>
  )
}

export function CircleSkeleton() {
  return (
    <View style={styles.circleSkeleton}>
      <Skeleton width={72} height={72} borderRadius={36} />
      <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
    </View>
  )
}

export function RoomGridSkeleton() {
  return (
    <View style={styles.roomGridSkeleton}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <View key={item} style={styles.roomItemSkeleton}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <Skeleton width={50} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  )
}

export function CategoryRowSkeleton() {
  return (
    <View style={styles.categoryRowSkeleton}>
      {[1, 2, 3, 4, 5].map((item) => (
        <CircleSkeleton key={item} />
      ))}
    </View>
  )
}

export function BrandCardSkeleton() {
  return (
    <View style={styles.brandCardSkeleton}>
      <Skeleton width={170} height={110} borderRadius={18} />
    </View>
  )
}

export function FeaturedProductsSkeleton() {
  return (
    <View style={styles.masonryGridSkeleton}>
      <View style={styles.masonryColumnSkeleton}>
        <Skeleton width="100%" height={220} borderRadius={8} />
        <Skeleton
          width="100%"
          height={260}
          borderRadius={8}
          style={{ marginTop: 8 }}
        />
      </View>
      <View style={styles.masonryColumnSkeleton}>
        <Skeleton width="100%" height={260} borderRadius={8} />
        <Skeleton
          width="100%"
          height={220}
          borderRadius={8}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  )
}

/**
 * Mirrors ProductDetailScreen's actual above-the-fold order: full-width image →
 * variant thumbnail strip (Shopee-style, right under the image) → large price →
 * social-proof line → product name. The description is below the fold (collapsed)
 * so it's intentionally omitted, keeping the skeleton lean and aligned.
 */
export function ProductDetailSkeleton({
  isDarkMode = false,
}: {
  isDarkMode?: boolean
}) {
  const bg = isDarkMode ? "#1f2937" : "#ffffff"
  const galleryBg = isDarkMode ? "#0f172a" : "#f5f5f5"
  return (
    <View style={[styles.pdContainer, { backgroundColor: bg }]}>
      {/* Full-width product image (matches the gallery's ~0.85 aspect) */}
      <View style={[styles.pdImage, { backgroundColor: galleryBg }]}>
        <Skeleton width="62%" height="62%" borderRadius={12} />
      </View>

      {/* Variant / thumbnail strip — sits right under the image (matches 60x60) */}
      <View style={styles.pdVariantRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            width={60}
            height={60}
            borderRadius={8}
            style={{ marginRight: 10 }}
          />
        ))}
      </View>

      {/* Price (large, first) → social proof → product name */}
      <View style={styles.pdInfo}>
        <Skeleton width={150} height={30} borderRadius={6} />
        <Skeleton width={120} height={12} style={{ marginTop: 12 }} />
        <Skeleton width="88%" height={16} style={{ marginTop: 18 }} />
        <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  )
}

/**
 * Mirrors a single ItemCard in the search/masonry grid: image block (height
 * matches ItemCard's 200, but accepts an override so columns can stagger like a
 * real masonry layout) → brand row → two-line product name → badge row → price.
 */
export function ItemCardSkeleton({
  imageHeight = 200,
  isDarkMode = false,
}: {
  imageHeight?: number
  isDarkMode?: boolean
}) {
  const bg = isDarkMode ? "#1e293b" : "#f8f9fa"
  const border = isDarkMode ? "#334155" : "#e5e7eb"
  const imageBg = isDarkMode ? "#0f172a" : "#f1f5f9"
  const block = isDarkMode ? "#334155" : "#e5e7eb"

  return (
    <View style={[styles.itemCardSkeleton, { backgroundColor: bg, borderColor: border }]}>
      <Skeleton
        width="100%"
        height={imageHeight}
        borderRadius={0}
        style={{ backgroundColor: imageBg }}
      />
      <View style={[styles.itemCardBorder, { backgroundColor: border }]} />
      <View style={styles.itemCardInfo}>
        <Skeleton width="55%" height={10} style={{ backgroundColor: block }} />
        <Skeleton width="92%" height={14} style={{ marginTop: 8, backgroundColor: block }} />
        <Skeleton width="70%" height={14} style={{ marginTop: 6, backgroundColor: block }} />
        <View style={styles.itemCardBadges}>
          <Skeleton width={52} height={18} borderRadius={8} style={{ backgroundColor: block }} />
          <Skeleton width={64} height={18} borderRadius={8} style={{ backgroundColor: block }} />
        </View>
        <Skeleton width="45%" height={18} style={{ marginTop: 6, backgroundColor: block }} />
      </View>
    </View>
  )
}

/**
 * Two-column masonry of ItemCardSkeletons matching SearchResultScreen's FlashList.
 * Image heights stagger per column so the placeholder reads like real results.
 */
export function SearchResultsSkeleton({
  isDarkMode = false,
}: {
  isDarkMode?: boolean
}) {
  const leftHeights = [200, 240, 180]
  const rightHeights = [240, 180, 220]
  return (
    <View
      style={[
        styles.searchSkeletonContainer,
        { backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5" },
      ]}
    >
      <View style={styles.searchSkeletonColumn}>
        {leftHeights.map((h, i) => (
          <ItemCardSkeleton key={`l-${i}`} imageHeight={h} isDarkMode={isDarkMode} />
        ))}
      </View>
      <View style={styles.searchSkeletonColumn}>
        {rightHeights.map((h, i) => (
          <ItemCardSkeleton key={`r-${i}`} imageHeight={h} isDarkMode={isDarkMode} />
        ))}
      </View>
    </View>
  )
}

/** One cart row placeholder: checkbox + image + 3 text lines + qty stepper. */
function CartRowSkeleton({ isDarkMode }: { isDarkMode?: boolean }) {
  const block = isDarkMode ? "#334155" : "#e5e7eb"
  const imageBg = isDarkMode ? "#0f172a" : "#f1f5f9"
  return (
    <View style={styles.cartRow}>
      <Skeleton width={20} height={20} borderRadius={4} style={{ backgroundColor: block }} />
      <Skeleton
        width={92}
        height={92}
        borderRadius={10}
        style={{ backgroundColor: imageBg }}
      />
      <View style={styles.cartRowInfo}>
        <Skeleton width="45%" height={10} style={{ backgroundColor: block }} />
        <Skeleton width="85%" height={14} style={{ marginTop: 8, backgroundColor: block }} />
        <Skeleton width="60%" height={14} style={{ marginTop: 6, backgroundColor: block }} />
        <View style={styles.cartRowBottom}>
          <Skeleton width={70} height={18} borderRadius={6} style={{ backgroundColor: block }} />
          <Skeleton width={80} height={26} borderRadius={8} style={{ backgroundColor: block }} />
        </View>
      </View>
    </View>
  )
}

/** Full cart-list skeleton (a brand header + several rows). */
export function CartSkeleton({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const block = isDarkMode ? "#334155" : "#e5e7eb"
  return (
    <View
      style={[
        styles.cartSkeleton,
        { backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5" },
      ]}
    >
      <View style={styles.cartBrandHeader}>
        <Skeleton width={20} height={20} borderRadius={4} style={{ backgroundColor: block }} />
        <Skeleton width={120} height={14} style={{ backgroundColor: block }} />
      </View>
      {[1, 2, 3, 4].map((i) => (
        <CartRowSkeleton key={i} isDarkMode={isDarkMode} />
      ))}
    </View>
  )
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.container}>
      <BannerSkeleton />

      <View style={styles.section}>
        <SectionHeaderSkeleton />
        <RoomGridSkeleton />
      </View>

      <View style={styles.section}>
        <SectionHeaderSkeleton />
        <CategoryRowSkeleton />
      </View>

      <View style={styles.section}>
        <SectionHeaderSkeleton />
        <View style={styles.brandRowSkeleton}>
          {[1, 2, 3].map((item) => (
            <BrandCardSkeleton key={item} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeaderSkeleton />
        <FeaturedProductsSkeleton />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  skeleton: {
    overflow: "hidden",
  },
  shimmerFill: {
    flex: 1,
  },
  bannerSkeleton: {
    marginBottom: 10,
  },
  section: {
    gap: 10,
  },
  sectionHeaderSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleSkeleton: {
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  roomGridSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
  },
  roomItemSkeleton: {
    width: "25%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  masonryGridSkeleton: {
    flexDirection: "row",
    gap: 8,
  },
  masonryColumnSkeleton: {
    flex: 1,
    gap: 8,
  },
  categoryRowSkeleton: {
    flexDirection: "row",
    paddingRight: 4,
  },
  brandCardSkeleton: {
    marginRight: 12,
  },
  brandRowSkeleton: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 4,
  },
  // Product detail skeleton
  pdContainer: {
    flex: 1,
  },
  pdImage: {
    width: "100%",
    height: SCREEN_WIDTH * 0.85,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  pdInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pdVariantRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Cart skeleton
  cartSkeleton: {
    flex: 1,
  },
  cartBrandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  cartRowInfo: {
    flex: 1,
  },
  cartRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  // Search results skeleton (2-column masonry mirroring SearchResultScreen)
  searchSkeletonContainer: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 5,
    paddingTop: 16,
    gap: 6,
  },
  searchSkeletonColumn: {
    flex: 1,
    gap: 8,
  },
  itemCardSkeleton: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  itemCardBorder: {
    height: 1,
  },
  itemCardInfo: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  itemCardBadges: {
    flexDirection: "row",
    gap: 5,
    marginTop: 10,
  },
})
