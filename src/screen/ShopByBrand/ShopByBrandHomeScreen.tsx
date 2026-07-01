// @ts-nocheck
import React, { useCallback, useMemo, useState } from "react"
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native"
import { Image } from "expo-image"
import { FlashList } from "@shopify/flash-list"

// Animated wrapper so the parent can drive a native-driver opacity from scroll.
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList)
import { WebView } from "react-native-webview"
import Ionicons from "../../components/ui/Icon"
import { Colors } from "../../constants/colors"
import FeaturedItems from "../../components/Items/FeaturedItems"
import ItemCard from "../../components/Items/ItemCard"
import {
  useInfiniteBrandProducts,
  type BrandProduct,
} from "../../hooks/query/useInfiniteBrandProducts"
import type {
  HomeSection,
  SectionProduct,
} from "../../services/brandHomeService"
import styles, { width } from "../../styles/ShopByBrandHomeScreen.styles"

interface ShopByBrandHomeScreenProps {
  sections?: HomeSection[]
  token?: string | null
  brandId?: number
  isZqBrand?: boolean
  isDarkMode?: boolean
  onProductPress?: (id: number) => void
  wishlistItems?: any[]
  onWishlistChange?: () => void
  // Sections (banner/carousel/products/text) loading state from the parent.
  sectionsLoading?: boolean
  // Refetch the brand-home sections (owned by the parent) on pull-to-refresh.
  onRefreshSections?: () => void
  onSeeMore?: () => void
  // Cover + brand profile + tabs, rendered at the very top of the feed so the
  // whole preview header scrolls away naturally (parent owns its state/logic).
  profileHeader?: React.ReactNode
  // Scroll handler (Animated.event) + list ref, so the parent can drive the
  // collapsing top bar and scroll the feed back to top.
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  listRef?: React.Ref<any>
}

// Width of a carousel slide inside a section (sections sit at 10px insets,
// matching the brand header content edges above).
const SLIDE_WIDTH = width - 20

// Map a DB SectionProduct to the FeaturedItems product shape. Member price wins
// (0/empty falls back to the original SRP), matching the web price helper.
const toCard = (p: SectionProduct) => ({
  id: p.id,
  name: p.name,
  image: p.image ?? "",
  priceMember: p.member_price ?? undefined,
  price: p.price ?? undefined,
  original_price: p.original_price ?? p.price ?? undefined,
  prodpv: p.pv != null ? String(p.pv) : undefined,
})

// Tolerant wishlist lookup — callers pass either {product:{id}} or {product_id}.
const findWishlist = (items: any[] | undefined, id: number) =>
  items?.find((w) => (w?.product?.id ?? w?.product_id) === id)

function ProductCard({
  product,
  token,
  isDarkMode,
  onProductPress,
  wishlistItems,
  onWishlistChange,
}: {
  product: ReturnType<typeof toCard>
  token?: string | null
  isDarkMode?: boolean
  onProductPress: (id: number) => void
  wishlistItems?: any[]
  onWishlistChange: () => void
}) {
  const wishlistItem = findWishlist(wishlistItems, product.id)
  return (
    <View style={styles.featuredItemWrap}>
      <FeaturedItems
        product={product}
        token={token}
        isDarkMode={isDarkMode}
        onPress={() => onProductPress(product.id)}
        isWishlisted={!!wishlistItem}
        wishlistId={wishlistItem?.wishlist_id ?? wishlistItem?.id}
        onWishlistToggle={onWishlistChange}
      />
    </View>
  )
}

function BannerSection({ section }: { section: HomeSection }) {
  const url = section.banner?.image_url
  if (!url) return null
  return (
    <View style={styles.bannerSection}>
      <Image
        source={{ uri: url }}
        style={styles.bannerSectionImage}
        contentFit="cover"
        transition={200}
      />
    </View>
  )
}

// Build a self-contained HTML document so the rich-text body renders with its
// exact authored design (inline text-align, heading sizes, bold/italic/underline,
// emoji). A small script reports the content height back so the WebView can be
// sized to fit inside the vertical scroll (it doesn't scroll itself).
const buildTextHtml = (body: string, textColor: string) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:transparent;}
  body{
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:${textColor};
    font-size:15px;
    line-height:1.55;
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  h1{font-size:24px;font-weight:800;margin:6px 0;}
  h2{font-size:20px;font-weight:700;margin:5px 0;}
  h3{font-size:17px;font-weight:600;margin:4px 0;}
  p{margin:6px 0;}
  ul,ol{margin:6px 0 6px 20px;}
  a{color:#0ea5e9;}
  img{max-width:100%;height:auto;border-radius:6px;}
  strong,b{font-weight:700;}
  em,i{font-style:italic;}
  u{text-decoration:underline;}
</style>
</head>
<body>${body}
<script>
  function reportHeight(){
    var h = document.body.scrollHeight;
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(h));
  }
  window.addEventListener('load', reportHeight);
  document.addEventListener('DOMContentLoaded', reportHeight);
  setTimeout(reportHeight, 200);
  setTimeout(reportHeight, 600);
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);
</script>
</body>
</html>`

function TextSection({
  section,
  themeColors,
}: {
  section: HomeSection
  themeColors: Record<string, string>
}) {
  const t = section.text
  const hasText = !!(t?.body && t.body.replace(/<[^>]*>/g, "").trim())
  const [height, setHeight] = useState(48)
  if (!hasText && !t?.image_url) return null

  return (
    <View
      style={[
        styles.textCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
        },
      ]}
    >
      {hasText ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html: buildTextHtml(t!.body, themeColors.text) }}
          style={{ width: "100%", height, backgroundColor: "transparent" }}
          containerStyle={{ backgroundColor: "transparent" }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          androidLayerType="hardware"
          onMessage={(e) => {
            const h = Number(e.nativeEvent.data)
            if (h > 0 && Math.abs(h - height) > 1) setHeight(h)
          }}
        />
      ) : null}
      {t?.image_url ? (
        <Image
          source={{ uri: t.image_url }}
          style={styles.textImage}
          contentFit="cover"
          transition={200}
        />
      ) : null}
    </View>
  )
}

function CarouselSection({ section }: { section: HomeSection }) {
  const items = useMemo(
    () => (section.items ?? []).filter((i) => i?.image_url),
    [section.items]
  )
  const [index, setIndex] = useState(0)

  if (items.length === 0) return null

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH))
  }

  return (
    <View style={styles.carouselSection}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {items.map((it, i) => (
          <Image
            key={it.id ?? i}
            source={{ uri: it.image_url }}
            style={{ width: SLIDE_WIDTH, aspectRatio: 16 / 7 }}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View style={styles.carouselDots}>
          {items.map((it, i) => (
            <View
              key={it.id ?? i}
              style={[
                styles.dot,
                {
                  width: i === index ? 16 : 8,
                  backgroundColor: i === index ? Colors.sky : "#cbd5e1",
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

function ProductSection({
  section,
  themeColors,
  isDarkMode,
  token,
  onProductPress,
  wishlistItems,
  onWishlistChange,
  onSeeMore,
}: {
  section: HomeSection
  themeColors: Record<string, string>
  isDarkMode?: boolean
  token?: string | null
  onProductPress: (id: number) => void
  wishlistItems?: any[]
  onWishlistChange: () => void
  onSeeMore: () => void
}) {
  const ps = section.product_section
  const products = ps?.products ?? []
  if (products.length === 0) return null

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.sectionHeaderRow,
          { borderBottomColor: themeColors.divider },
        ]}
      >
        <Text
          style={[styles.sectionTitle, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {ps?.label || "Products"}
        </Text>
        {ps?.button_text ? (
          <TouchableOpacity style={styles.sectionButton} onPress={onSeeMore}>
            <Text style={[styles.seeMoreText, { color: Colors.sky }]}>
              {ps.button_text}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.sky} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredGrid}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={toCard(p)}
            token={token}
            isDarkMode={isDarkMode}
            onProductPress={onProductPress}
            wishlistItems={wishlistItems}
            onWishlistChange={onWishlistChange}
          />
        ))}
      </ScrollView>
    </View>
  )
}

// Masonry skeleton shown on first load (instead of a bare spinner).
function SkeletonCard({
  height,
  card,
  border,
  shimmer,
  imgBg,
}: {
  height: number
  card: string
  border: string
  shimmer: string
  imgBg: string
}) {
  return (
    <View
      style={[styles.skelCard, { backgroundColor: card, borderColor: border }]}
    >
      <View style={[styles.skelImage, { height, backgroundColor: imgBg }]} />
      <View style={styles.skelBody}>
        <View style={[styles.skelLine, { backgroundColor: shimmer }]} />
        <View
          style={[styles.skelLine, { width: "60%", backgroundColor: shimmer }]}
        />
        <View
          style={[
            styles.skelLine,
            { width: "40%", marginTop: 4, backgroundColor: shimmer },
          ]}
        />
      </View>
    </View>
  )
}

function FeedSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  const card = isDarkMode ? "#1e293b" : Colors.white
  const border = isDarkMode ? "#334155" : "#e2e8f0"
  const shimmer = isDarkMode ? "#334155" : "#e5e7eb"
  const imgBg = isDarkMode ? "#0f172a" : "#f1f5f9"
  const left = [170, 130, 160]
  const right = [130, 180, 150]
  return (
    <View style={styles.skelWrap}>
      <View style={styles.skelCol}>
        {left.map((h, i) => (
          <SkeletonCard
            key={`l${i}`}
            height={h}
            card={card}
            border={border}
            shimmer={shimmer}
            imgBg={imgBg}
          />
        ))}
      </View>
      <View style={styles.skelCol}>
        {right.map((h, i) => (
          <SkeletonCard
            key={`r${i}`}
            height={h}
            card={card}
            border={border}
            shimmer={shimmer}
            imgBg={imgBg}
          />
        ))}
      </View>
    </View>
  )
}

export default function ShopByBrandHomeScreen({
  sections = [],
  token,
  brandId,
  isZqBrand = false,
  isDarkMode = false,
  onProductPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
  sectionsLoading = false,
  onRefreshSections = () => {},
  onSeeMore = () => {},
  profileHeader = null,
  onScroll,
  listRef,
}: ShopByBrandHomeScreenProps) {
  const themeColors = {
    containerBg: isDarkMode ? "#0f172a" : "#f5f5f5",
    text: isDarkMode ? "#f1f5f9" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1e293b" : Colors.white,
    cardBorder: isDarkMode ? "#334155" : "#e2e8f0",
    divider: isDarkMode ? "#334155" : "#eef2f7",
  }

  // Sections in saved display order (already ordered by the API; sort defensively).
  const visibleSections = useMemo(
    () =>
      sections
        .filter((s) => s?.is_active !== false)
        .slice()
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)),
    [sections]
  )

  // Product ids already shown inside a product section — excluded from "For You".
  const sectionProductIds = useMemo(() => {
    const ids = new Set<number>()
    for (const s of visibleSections) {
      if (s.type !== "products") continue
      for (const p of s.product_section?.products ?? []) ids.add(p.id)
    }
    return ids
  }, [visibleSections])

  // "For You" feed — the brand's other products, paginated exactly like the Shop
  // screen (infinite query + onEndReached), with section products filtered out.
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isRefetching,
    refetch,
  } = useInfiniteBrandProducts({
    token,
    brandId,
    isZqBrand,
    perPage: 16,
  })

  const forYouProducts = useMemo<BrandProduct[]>(() => {
    const flat = data?.pages.flatMap((p) => p.products) ?? []
    const seen = new Set<number>()
    const out: BrandProduct[] = []
    for (const p of flat) {
      if (sectionProductIds.has(p.id) || seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
    }
    return out
  }, [data?.pages, sectionProductIds])

  const renderGridItem = useCallback(
    ({ item }: { item: BrandProduct }) => {
      const wishlistItem = findWishlist(wishlistItems, item.id)
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
        <View style={styles.forYouItem}>
          <ItemCard
            product={productCard}
            token={token}
            isDarkMode={isDarkMode}
            onPress={(p) => onProductPress(p.id)}
            isWishlisted={!!wishlistItem}
            wishlistId={wishlistItem?.wishlist_id ?? wishlistItem?.id}
            onWishlistToggle={onWishlistChange}
          />
        </View>
      )
    },
    [token, isDarkMode, wishlistItems, onProductPress, onWishlistChange]
  )

  const keyExtractor = useCallback(
    (item: BrandProduct, index: number) => `${item.id}-${index}`,
    []
  )

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const onRefresh = useCallback(() => {
    refetch()
    onRefreshSections()
  }, [refetch, onRefreshSections])

  // Header = all the DB-driven sections, then the plain "For You" label (no card
  // background) that introduces the masonry feed below.
  const ListHeader = useMemo(
    () => (
      <>
        <View style={styles.headerBleed}>{profileHeader}</View>
        <View style={styles.headerWrap}>
          {visibleSections.map((section) => {
            if (section.type === "banner") {
              return <BannerSection key={section.id} section={section} />
            }
            if (section.type === "carousel") {
              return <CarouselSection key={section.id} section={section} />
            }
            if (section.type === "text") {
              return (
                <TextSection
                  key={section.id}
                  section={section}
                  themeColors={themeColors}
                />
              )
            }
            return (
              <ProductSection
                key={section.id}
                section={section}
                themeColors={themeColors}
                isDarkMode={isDarkMode}
                token={token}
                onProductPress={onProductPress}
                wishlistItems={wishlistItems}
                onWishlistChange={onWishlistChange}
                onSeeMore={onSeeMore}
              />
            )
          })}

          {forYouProducts.length > 0 ? (
            <Text style={[styles.forYouLabel, { color: themeColors.text }]}>
              For You
            </Text>
          ) : null}
        </View>
      </>
    ),
    [
      profileHeader,
      visibleSections,
      forYouProducts.length,
      themeColors,
      isDarkMode,
      token,
      wishlistItems,
      onProductPress,
      onWishlistChange,
      onSeeMore,
    ]
  )

  const ListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.sky} />
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          Loading more...
        </Text>
      </View>
    )
  }, [isFetchingNextPage, themeColors.textSecondary])

  const ListEmpty = useCallback(() => {
    if (isLoading || sectionsLoading) {
      return <FeedSkeleton isDarkMode={isDarkMode} />
    }
    // Sections exist but no leftover products — nothing extra to show.
    if (visibleSections.length > 0) return null
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="storefront-outline"
          size={40}
          color={themeColors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          This brand hasn&apos;t set up its store yet.
        </Text>
      </View>
    )
  }, [
    isLoading,
    sectionsLoading,
    isDarkMode,
    visibleSections.length,
    themeColors.textSecondary,
  ])

  return (
    <AnimatedFlashList
      ref={listRef}
      data={forYouProducts}
      masonry
      numColumns={2}
      renderItem={renderGridItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.forYouListContent}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={ListEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? "#fff" : Colors.sky}
          colors={[Colors.sky]}
        />
      }
    />
  )
}
