// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Share,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import RenderHtml from "react-native-render-html"
import { Colors } from "../constants/colors"
import {
  productService,
  type Product,
  type ProductCard,
  type ProductReviewsResponse,
} from "../services/productService"
import { authService } from "../services/authService"
import { userBehaviorService } from "../services/userBehaviorService"
import { useProductDetail } from "../hooks/query/useProductDetail"
import ItemCard from "../components/Items/ItemCard"
import FeaturedItems from "../components/Items/FeaturedItems"
import ImageViewerModal from "../components/Items/ImageViewerModal"
import BuyNowModal from "../components/Items/BuyNowModal"
import AddToCartModal from "../components/Items/AddToCartModal"
import { ProductDetailSkeleton } from "../components/SkeletonLoader/SkeletonLoader"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import Toast from "react-native-toast-message"
import styles from "../styles/ProductDetailScreen.styles"

const SCREEN_WIDTH = Dimensions.get("window").width

interface WishlistItem {
  wishlist_id: number
  product_id: number
  date_added: string
}

interface ProductDetailScreenProps {
  productId: number
  token?: string | null
  onBack: () => void
  onProductPress?: (id: number) => void
  onSearch?: () => void
  onCartUpdate?: () => void
  onNavigateToCart?: () => void
  onWishlistToggle?: (productId: number, isWishlisted: boolean) => void
  onShopNavigate?: (brandType: number, shopName: string) => void
  onCheckout?: (product: any, quantity: number, variant?: any) => void
  user?: {
    name?: string
    avatar_url?: string
    badge_name?: string
    username?: string
    monthly_activation?: {
      current_month_pv: number
      threshold_pv: number
      remaining_pv: number
    }
  } | null
  cartCount?: number
  wishlistItems?: WishlistItem[]
  isDarkMode?: boolean
  /** When true, this product comes from the ZQ separate backend. */
  isZq?: boolean
}

const BADGE_CONFIG = [
  {
    key: "musthave" as const,
    label: "Must Have",
    bg: ["#f97316", "#ea580c"] as [string, string],
    icon: "heart" as const,
  },
  {
    key: "bestseller" as const,
    label: "Bestseller",
    bg: ["#d4a017", "#b8860b"] as [string, string],
    icon: "flame" as const,
  },
  {
    key: "salespromo" as const,
    label: "On Sale",
    bg: [Colors.forest, "#1e4236"] as [string, string],
    icon: "flash" as const,
  },
]

interface BrandProfile {
  id: number
  name: string
  profile_picture?: string
  status: number
  is_online: boolean
  chat_performance: number
  overall_rating: number
  total_reviews: number
  total_products: number
  joined_date: string
  supplier_name: string
}

function toProductCard(p: Product): ProductCard {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    soldCount: p.soldCount,
    originalPrice: p.priceSrp,
    memberPrice: p.priceMember,
    pv: p.prodpv,
    brandName: p.brand,
    variantCount: p.variants?.length ?? 0,
    badges: {
      musthave: p.musthave,
      bestseller: p.bestseller,
      salespromo: p.salespromo,
    },
  }
}

export default function ProductDetailScreen({
  productId,
  token,
  onBack,
  onProductPress,
  onSearch,
  onCartUpdate,
  onNavigateToCart,
  onWishlistToggle,
  onShopNavigate,
  onCheckout,
  user,
  cartCount = 0,
  wishlistItems = [],
  isDarkMode = false,
  isZq = false,
}: ProductDetailScreenProps) {
  const insets = useSafeAreaInsets()

  // Primary product detail GET migrated to React Query. `isZq` routes to the
  // ZQ separate backend; the response is normalized to the canonical Product
  // type so everything below renders identically to a regular product.
  const {
    data: product = null,
    isLoading: loading,
  } = useProductDetail({ productId, token, isZq })

  const [relatedProducts, setRelatedProducts] = useState<ProductCard[]>([])
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [productReviews, setProductReviews] =
    useState<ProductReviewsResponse | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [specificationsExpanded, setSpecificationsExpanded] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [imageViewerIndex, setImageViewerIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const galleryScrollRef = useRef<ScrollView>(null)
  const imageViewerScrollRef = useRef<ScrollView>(null)
  // Horizontal variant/thumbnail strip + each item's measured position, so the
  // active variant can be auto-scrolled into view while swiping the gallery.
  const variantsScrollRef = useRef<ScrollView>(null)
  const variantLayoutsRef = useRef<Record<number, { x: number; width: number }>>(
    {}
  )

  // Tracks the gallery image currently in view, so the focus logic only runs
  // when the index actually changes (avoids per-frame re-renders during scroll).
  const lastGalleryIndexRef = useRef(0)

  // Scroll the variant strip so the given variant is centered in the viewport.
  const centerVariantInView = (variantId: number) => {
    const layout = variantLayoutsRef.current[variantId]
    if (!layout || !variantsScrollRef.current) return
    const targetX = layout.x + layout.width / 2 - SCREEN_WIDTH / 2
    variantsScrollRef.current.scrollTo({ x: Math.max(0, targetX), animated: true })
  }
  const [showHeaderOnScroll, setShowHeaderOnScroll] = useState(false)
  const headerTranslateY = useState(() => new Animated.Value(-100))[0]
  const headerOpacity = useState(() => new Animated.Value(0))[0]
  const imageAnimX = useState(() => new Animated.Value(0))[0]
  const imageAnimY = useState(() => new Animated.Value(0))[0]
  const imageAnimScale = useState(() => new Animated.Value(1))[0]
  const imageAnimOpacity = useState(() => new Animated.Value(0))[0]
  const [showAnimatedImage, setShowAnimatedImage] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [youMayAlsoLike, setYouMayAlsoLike] = useState<ProductCard[]>([])
  const [visibleYouMayAlsoLikeCount, setVisibleYouMayAlsoLikeCount] =
    useState(8)
  const [wishlistCount, setWishlistCount] = useState<number | null>(null)
  const [optimisticCartCount, setOptimisticCartCount] = useState(0)

  // --- Derived/optimistic state synced during render (not in effects) ---
  // `isWishlisted` is optimistic (set instantly on tap, rolled back on error),
  // but must also track the source of truth (wishlistItems). Re-sync only when
  // the derived value changes, preserving the optimistic value otherwise.
  const derivedWishlisted =
    !!product && wishlistItems.some((item) => item.product_id === product.id)
  const [prevDerivedWishlisted, setPrevDerivedWishlisted] = useState(false)
  if (derivedWishlisted !== prevDerivedWishlisted) {
    setPrevDerivedWishlisted(derivedWishlisted)
    setIsWishlisted(derivedWishlisted)
  }

  // Clear the optimistic cart bump once the real cart count updates.
  const [prevCartCount, setPrevCartCount] = useState(cartCount)
  if (cartCount !== prevCartCount) {
    setPrevCartCount(cartCount)
    setOptimisticCartCount(0)
  }

  // Reset secondary UI state when the viewed product changes (imperative
  // animation/scroll resets stay in an effect below).
  const [prevProductId, setPrevProductId] = useState(productId)
  if (productId !== prevProductId) {
    setPrevProductId(productId)
    setRelatedProducts([])
    setYouMayAlsoLike([])
    setVisibleYouMayAlsoLikeCount(8)
    setBrandProfile(null)
    setActiveImage(0)
    setDescriptionExpanded(false)
    setSpecificationsExpanded(false)
    setSelectedVariant(null)
    setShowHeaderOnScroll(false)
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        console.log("🔙 Back button pressed")
        if (showImageViewer) {
          console.log("📸 Closing image viewer")
          setShowImageViewer(false)
          return true
        }
        if (showBuyModal) {
          console.log("🛒 Closing buy modal")
          setShowBuyModal(false)
          return true
        }
        console.log("🚪 Going back")
        onBack()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack, showBuyModal, showImageViewer])

  // Fetch wishlist count for the product
  useEffect(() => {
    if (!token || !productId) return
    let active = true

    productService
      .getWishlistCount(productId, token)
      .then((count) => {
        if (active) setWishlistCount(count)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [token, productId])

  // Imperative resets (animation values + scroll position) when the product
  // changes — external-system sync, correct to keep in an effect. The React
  // state resets are handled during render above (prevProductId).
  useEffect(() => {
    lastGalleryIndexRef.current = 0
    headerTranslateY.setValue(-100)
    headerOpacity.setValue(0)
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [productId, headerTranslateY, headerOpacity])

  // When the product (from React Query) is available, run cascading fetches.
  useEffect(() => {
    const data = product
    if (!data) return
    console.log(`✅ Product loaded: ${data.name} (ID: ${data.id})`)

    let active = true

    // (isWishlisted is derived during render — see prevDerivedWishlisted above.)

    // Set first variant as default once the product data loads (initializing
    // local selection from async-fetched data; the user can change it after).
    if (data.variants && data.variants.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize default selection from async-loaded product
      setSelectedVariant(data.variants[0].id)
    }

    // Fetch brand profile if brandType is available
    if (data.brandType && token) {
      authService
        .getBrandProfile(data.brandType, token)
        .then((brandData) => {
          if (active && brandData) setBrandProfile(brandData)
        })
        .catch(() => {})
    }

    // Fetch product reviews
    if (token) {
      productService
        .getProductReviews(productId, token)
        .then((reviewsData) => {
          if (active && reviewsData) setProductReviews(reviewsData)
        })
        .catch(() => {})
    }

    // Track product view behavior
    if (token && data?.id) {
      userBehaviorService
        .trackBehavior(
          token,
          "product_view",
          data.id,
          data.catid,
          data.brandType
        )
        .catch(() => {})
    }

    // Fetch related products by brand type
    if (data.brandType && token) {
      productService
        .getProductsByBrand(data.brandType, token)
        .then((items) => {
          if (!active) return
          const filteredItems = items.filter((p) => p.id !== productId)
          // Shuffle the array and take 8 items
          const shuffled = filteredItems.sort(() => Math.random() - 0.5)
          const cards = shuffled.slice(0, 8).map(toProductCard)
          setRelatedProducts(cards)
        })
        .catch(() => {})
    }

    // Fetch "You May Also Like" products
    if (token) {
      productService
        .getProducts(token)
        .then((items) => {
          if (!active) return
          // Filter out current product and shuffle
          const filteredItems = items.filter((p) => p.id !== productId)
          const shuffled = filteredItems.sort(() => Math.random() - 0.5)
          // Take at least 20 items for lazy loading
          const cards = shuffled
            .slice(0, Math.max(20, shuffled.length))
            .map(toProductCard)
          setYouMayAlsoLike(cards)
        })
        .catch(() => {})
    }

    return () => {
      active = false
    }
  }, [product, productId, token])

  // Create image list with variant mapping (unique images only)
  const imagesWithVariants = useMemo(() => {
    if (!product) return []

    const list: { image: string; variantId: number | null }[] = []
    const addedImages = new Set<string>()

    // Add variant images first (with variant ID) - only if not already added
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (v.images && v.images.length > 0) {
          const imgUrl = v.images[0]
          // Only add if this image hasn't been added yet
          if (!addedImages.has(imgUrl)) {
            list.push({ image: imgUrl, variantId: v.id })
            addedImages.add(imgUrl)
          }
        }
      })
    }

    // Add product images (no variant ID - don't auto-select)
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && !addedImages.has(img)) {
          list.push({ image: img, variantId: null })
          addedImages.add(img)
        }
      })
    }

    // Add main product image if not already added
    if (product.image && !addedImages.has(product.image)) {
      list.push({ image: product.image, variantId: null })
      addedImages.add(product.image)
    }

    return list
  }, [product])

  const images = useMemo(() => {
    return imagesWithVariants.map((item) => item.image)
  }, [imagesWithVariants])

  // Focus a gallery image: update the active image + matching variant and center
  // its thumbnail. Called live from onScroll so the strip tracks the swipe with
  // no lag, guarded so it fires once per image crossing (not every frame).
  const focusGalleryImage = (index: number) => {
    if (index < 0 || index >= images.length) return
    if (index === lastGalleryIndexRef.current) return
    lastGalleryIndexRef.current = index
    setActiveImage(index)
    const item = imagesWithVariants[index]
    if (item && item.variantId !== null) {
      setSelectedVariant(item.variantId)
      centerVariantInView(item.variantId)
    }
  }

  const hasDiscount = product
    ? (product.priceMember ?? 0) < (product.priceSrp ?? 0)
    : false
  const activeBadges = product
    ? BADGE_CONFIG.filter((b) => (product as any)[b.key])
    : []

  const handleScrollEvent = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollY = event.nativeEvent.contentOffset.y
    const contentHeight = event.nativeEvent.contentSize.height
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height

    setShowHeaderOnScroll(scrollY > 100)

    // Auto-load more items when user scrolls near bottom
    if (contentHeight - scrollY - scrollViewHeight < 500) {
      if (visibleYouMayAlsoLikeCount < youMayAlsoLike.length) {
        setVisibleYouMayAlsoLikeCount((prev) =>
          Math.min(prev + 8, youMayAlsoLike.length)
        )
      }
    }
  }

  useEffect(() => {
    if (showHeaderOnScroll) {
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [showHeaderOnScroll, headerTranslateY, headerOpacity])

  const addToCart = async (cartData: {
    product_id: number
    variant_id?: number
    quantity: number
    selected_color?: string | null
    selected_size?: string | null
    selected_type?: string | null
  }) => {
    if (!token) {
      console.log("Missing token")
      return
    }

    setAddingToCart(true)
    try {
      console.log("Add to cart data received:", cartData)

      const requestData: any = {
        product_id: cartData.product_id,
        quantity: cartData.quantity,
      }

      // Only include variant_id if it exists and is not null
      if (cartData.variant_id) {
        requestData.variant_id = cartData.variant_id
      }

      // Include variant details if they exist
      if (cartData.selected_color) {
        requestData.selected_color = cartData.selected_color
      }
      if (cartData.selected_size) {
        requestData.selected_size = cartData.selected_size
      }
      if (cartData.selected_type) {
        requestData.selected_type = cartData.selected_type
      }

      console.log("Sending to API:", requestData)

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/cart/add`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data?.success) {
        console.log("Item added to cart successfully")
        setShowAddToCartModal(false)

        // Track cart add behavior
        userBehaviorService
          .trackBehavior(token, "cart_add", cartData.product_id)
          .catch(() => {})

        onCartUpdate?.()
      }
    } catch (error: any) {
      console.error("Failed to add to cart:", error)
      console.error("Error response:", error?.response?.data)
      console.error("Error status:", error?.response?.status)
      console.error("Error headers:", error?.response?.headers)

      let errorMessage = "Failed to add item to cart"

      // Check for specific database errors
      if (
        error?.response?.data?.error?.includes("column") &&
        error?.response?.data?.error?.includes("does not exist")
      ) {
        errorMessage =
          "Server database error. Please try again later or contact support."
      } else if (error?.response?.data?.message) {
        errorMessage = error?.response?.data?.message
      }

      console.error("Error details:", errorMessage)
    } finally {
      setAddingToCart(false)
    }
  }

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleShareProduct = async () => {
    if (!product) return

    try {
      const slug = slugify(product.name)
      const shareUrl = `https://afhome.ph/product/${slug}-i${product.id}`

      await Share.share({
        message: `Check out this product: ${product.name}\n\n${shareUrl}`,
      })
    } catch (error) {
      console.error("Error sharing product:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to share product",
      })
    }
  }

  const animateAddToCart = () => {
    // Optimistic update - increment cart count immediately
    setOptimisticCartCount((prev) => prev + 1)

    // Show animated image overlay
    setShowAnimatedImage(true)

    // Calculate position of cart icon in header (top right, left of share icon)
    const cartIconX = SCREEN_WIDTH - 120
    const cartIconY = insets.top + 20

    // Image starts at center, needs to move to cart icon position
    const imageStartY = SCREEN_WIDTH / 2

    // Animate image flying to cart icon
    Animated.sequence([
      Animated.parallel([
        Animated.timing(imageAnimOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(imageAnimX, {
          toValue: cartIconX - SCREEN_WIDTH / 2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(imageAnimY, {
          toValue: cartIconY - imageStartY,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(imageAnimScale, {
          toValue: 0.15,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(imageAnimOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animation values and hide overlay
      imageAnimX.setValue(0)
      imageAnimY.setValue(0)
      imageAnimScale.setValue(1)
      imageAnimOpacity.setValue(0)
      setShowAnimatedImage(false)
    })
  }

  const toggleWishlist = async () => {
    console.log(
      "[ProductDetail] toggleWishlist - token:",
      token ? "exists" : "missing",
      "user:",
      user ? "exists" : "missing"
    )

    if (!token || !user) {
      console.log(
        "[ProductDetail] Auth check failed - token:",
        !!token,
        "user:",
        !!user
      )
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please log in to add items to wishlist",
      })
      return
    }

    if (!product) {
      console.log("Missing product")
      return
    }

    // Optimistic update - immediately update UI without showing toast
    const previousWishlistState = isWishlisted
    const newWishlistState = !isWishlisted
    const previousWishlistCount = wishlistCount ?? 0

    setIsWishlisted(newWishlistState)
    // Update wishlist count optimistically
    setWishlistCount(
      newWishlistState
        ? previousWishlistCount + 1
        : Math.max(0, previousWishlistCount - 1)
    )
    setWishlistLoading(true)

    // Process API call in background without blocking UI
    try {
      if (previousWishlistState) {
        // Remove from wishlist - DELETE request
        await axios.delete(`${API_CONFIG.BASE_URL}/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        // Add to wishlist - POST request
        await axios.post(
          `${API_CONFIG.BASE_URL}/wishlist`,
          { product_id: product.id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      // API succeeded - notify parent
      onWishlistToggle?.(product.id, newWishlistState)

      // Track wishlist behavior in background
      const behaviorType = newWishlistState ? "wishlist_add" : "wishlist_remove"
      if (product?.id && product?.catid && product?.brandType) {
        userBehaviorService
          .trackBehavior(
            token,
            behaviorType,
            product.id,
            product.catid,
            product.brandType
          )
          .catch(() => {})
      }
    } catch (error: any) {
      console.error("Failed to update wishlist:", error)

      // Revert optimistic updates on error
      setIsWishlisted(previousWishlistState)
      setWishlistCount(previousWishlistCount)

      // Only show error toast
      Toast.show({
        type: "error",
        text1: "Error",
        text2: previousWishlistState
          ? "Failed to remove from wishlist"
          : "Failed to add to wishlist",
      })
    } finally {
      setWishlistLoading(false)
    }
  }

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#ffffff",
    containerBg: isDarkMode ? "#1e293b" : "#f8fbff",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#334155" : "#e5e7eb",
    card: isDarkMode ? "#1e293b" : Colors.white,
    cardBorder: isDarkMode ? "#334155" : "#e5e7eb",
    divider: isDarkMode ? "#334155" : "#f1f5f9",
  }

  if (loading) {
    console.log("⏳ ProductDetailScreen: Loading state...")
  } else if (product) {
    console.log(`📦 ProductDetailScreen: Rendering product "${product.name}"`)
    console.log(
      `📝 Description: ${product.description ? "YES (length: " + product.description.length + ")" : "NO"}`
    )
    console.log(`📋 Specifications: ${product.specifications ? "YES" : "NO"}`)
    console.log(`🔧 Material: ${product.material ? "YES" : "NO"}`)
    console.log(`⚡ Warranty: ${product.warranty ? "YES" : "NO"}`)
    console.log(`📐 Dimensions: ${product.pswidth ? "YES" : "NO"}`)
  } else {
    console.log("❌ ProductDetailScreen: No product data available")
  }

  return (
    <View style={styles.root}>
      {console.log("🎯 [ProductDetailScreen] Starting main render...")}
      {loading ? (
        <ProductDetailSkeleton isDarkMode={isDarkMode} />
      ) : product ? (
        <>
          <Animated.View
            style={[
              styles.animatedHeader,
              {
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
              },
            ]}
            pointerEvents={showHeaderOnScroll ? "auto" : "none"}
          >
            <View
              style={[
                styles.scrollHeader,
                { backgroundColor: colors.card, paddingTop: insets.top },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  try {
                    if (onBack && typeof onBack === "function") {
                      onBack()
                    }
                  } catch (error) {
                    console.error("Error in back navigation:", error)
                  }
                }}
                style={styles.scrollHeaderBackBtn}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text
                style={[styles.scrollHeaderTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {product?.name || ""}
              </Text>
              <View style={styles.scrollHeaderActions}>
                <TouchableOpacity
                  onPress={onNavigateToCart}
                  style={{ position: "relative" }}
                >
                  <Ionicons name="cart" size={20} color={colors.text} />
                  {cartCount + optimisticCartCount > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "#ef4444",
                        borderRadius: 8,
                        minWidth: 16,
                        height: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.bg,
                      }}
                    >
                      <Text
                        style={{
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        {cartCount + optimisticCartCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShareProduct}>
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { backgroundColor: colors.containerBg },
            ]}
            onScroll={handleScrollEvent}
            scrollEventThrottle={16}
          >
            {/* Image Gallery */}
            <View
              style={[
                styles.galleryWrap,
                {
                  backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5",
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <ScrollView
                ref={galleryScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                style={{ backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5" }}
                onScroll={(e) => {
                  // Track the active image live (crosses at the halfway point) so
                  // the bottom thumbnail focuses immediately, not after momentum ends.
                  focusGalleryImage(
                    Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                  )
                }}
                onMomentumScrollEnd={(e) => {
                  // Final settle — ensures the exact landing index is focused.
                  focusGalleryImage(
                    Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                  )
                }}
              >
                {images.length > 0 ? (
                  images.map((img, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.95}
                      onPress={() => {
                        // Set active image and scroll gallery to this image
                        setActiveImage(i)
                        setImageViewerIndex(i)
                        setShowImageViewer(true)
                        galleryScrollRef.current?.scrollTo({
                          x: i * SCREEN_WIDTH,
                          animated: true,
                        })
                        // Auto-select variant based on image index
                        if (
                          imagesWithVariants.length > i &&
                          imagesWithVariants[i].variantId !== null
                        ) {
                          setSelectedVariant(imagesWithVariants[i].variantId)
                        }
                      }}
                      style={[
                        styles.galleryImageContainer,
                        { backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5" },
                      ]}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.galleryImage}
                        contentFit="contain"
                        transition={200}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View
                    style={[
                      styles.galleryImageContainer,
                      styles.galleryFallback,
                      { backgroundColor: isDarkMode ? "#0f172a" : "#f5f5f5" },
                    ]}
                  >
                    <Ionicons name="image-outline" size={48} color="#d1d5db" />
                  </View>
                )}
              </ScrollView>
              {/* Page Counter */}
              {images.length > 0 && (
                <View style={styles.galleryPageCounter}>
                  <Text style={styles.galleryPageCounterText}>
                    {activeImage + 1}/{images.length}
                  </Text>
                </View>
              )}
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => {
                  try {
                    if (onBack && typeof onBack === "function") {
                      onBack()
                    } else {
                      console.warn("onBack callback is not available")
                    }
                  } catch (error) {
                    console.error("Error in back navigation:", error)
                  }
                }}
                style={[styles.galleryBackBtn, { paddingTop: insets.top + 10 }]}
                activeOpacity={0.7}
              >
                <View style={styles.galleryBackBtnInner}>
                  <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </View>
              </TouchableOpacity>

              {/* Top Right Icons */}
              <View
                style={[
                  styles.galleryTopRightIcons,
                  { paddingTop: insets.top + 10 },
                ]}
              >
                {/* Add to Cart Icon */}
                <TouchableOpacity
                  onPress={onNavigateToCart}
                  style={styles.galleryIconBtn}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.galleryIconBtnInner,
                      { position: "relative" },
                    ]}
                  >
                    <Ionicons name="cart" size={22} color={Colors.white} />
                    {cartCount + optimisticCartCount > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          backgroundColor: "#ef4444",
                          borderRadius: 10,
                          minWidth: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1.5,
                          borderColor: Colors.white,
                        }}
                      >
                        <Text
                          style={{
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {cartCount + optimisticCartCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Share Icon */}
                <TouchableOpacity
                  onPress={handleShareProduct}
                  style={styles.galleryIconBtn}
                  activeOpacity={0.7}
                >
                  <View style={styles.galleryIconBtnInner}>
                    <Ionicons
                      name="share-social-outline"
                      size={22}
                      color={Colors.white}
                    />
                  </View>
                </TouchableOpacity>

                {/* Wishlist / Save */}
                <TouchableOpacity
                  onPress={toggleWishlist}
                  disabled={wishlistLoading}
                  style={styles.galleryIconBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  accessibilityState={{ selected: isWishlisted }}
                >
                  <View style={styles.galleryIconBtnInner}>
                    <Ionicons
                      name={isWishlisted ? "heart" : "heart-outline"}
                      size={22}
                      color={isWishlisted ? "#ef4444" : Colors.white}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Variants - Shopee Style (Bottom of Image) */}
            {product.variants && product.variants.length > 0 && (
              <View
                style={[
                  styles.shopeeVariantsBar,
                  {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <ScrollView
                  ref={variantsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.shopeeVariantsScroll}
                  contentContainerStyle={styles.shopeeVariantsContainer}
                >
                  {product.variants.map((variant, index) => {
                    const isSize = variant.size && !variant.images

                    return (
                      <View
                        key={variant.id}
                        onLayout={(e) => {
                          variantLayoutsRef.current[variant.id] = {
                            x: e.nativeEvent.layout.x,
                            width: e.nativeEvent.layout.width,
                          }
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.shopeeVariantItem,
                            selectedVariant === variant.id &&
                              styles.shopeeVariantItemSelected,
                            {
                              borderColor:
                                selectedVariant === variant.id
                                  ? Colors.sky
                                  : colors.divider,
                            },
                          ]}
                          onPress={() => {
                            setSelectedVariant(variant.id)
                            // Scroll gallery to this variant's image
                            if (variant.images && variant.images.length > 0) {
                              const variantImageIndex =
                                imagesWithVariants.findIndex(
                                  (item) => item.variantId === variant.id
                                )
                              if (variantImageIndex >= 0) {
                                setActiveImage(variantImageIndex)
                                galleryScrollRef.current?.scrollTo({
                                  x: variantImageIndex * SCREEN_WIDTH,
                                  animated: true,
                                })
                              }
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {variant.images && variant.images.length > 0 ? (
                            <Image
                              source={{ uri: variant.images[0] }}
                              style={styles.shopeeVariantImage}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : variant.colorHex ? (
                            <View
                              style={[
                                styles.shopeeVariantColor,
                                { backgroundColor: variant.colorHex },
                              ]}
                            />
                          ) : isSize ? (
                            <Text
                              style={[
                                styles.shopeeVariantSizeText,
                                { color: colors.text },
                              ]}
                            >
                              {variant.size}
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.shopeeVariantText,
                                { color: colors.text },
                              ]}
                            >
                              {variant.name}
                            </Text>
                          )}
                          {selectedVariant === variant.id && (
                            <View style={styles.shopeeVariantCheck}>
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color={Colors.white}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                        {selectedVariant === variant.id &&
                          variant.colorHex &&
                          !variant.images?.length && (
                            <Text
                              style={[
                                styles.shopeeVariantLabel,
                                { color: colors.text },
                              ]}
                            >
                              {variant.color || variant.name}
                            </Text>
                          )}
                      </View>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            {/* Price Section - Shopee Style (Price First, Large & Bold) */}
            <View
              style={[styles.newPriceSection, { backgroundColor: colors.card }]}
            >
              {(() => {
                let memberPrice = product.priceMember ?? 0
                let srpPrice = product.priceSrp ?? 0
                let variantDiscount = 0

                // If variant is selected, use variant prices
                if (selectedVariant && product.variants) {
                  const selectedVar = product.variants.find(
                    (v) => v.id === selectedVariant
                  )
                  if (selectedVar) {
                    memberPrice = selectedVar.priceMember ?? 0
                    srpPrice = selectedVar.priceSrp ?? 0
                  }
                }

                variantDiscount =
                  memberPrice < srpPrice
                    ? Math.round(((srpPrice - memberPrice) / srpPrice) * 100)
                    : 0

                return (
                  <>
                    {variantDiscount > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={Colors.sky}
                          />
                          <Text
                            style={[
                              styles.priceLabel,
                              { color: colors.textSec },
                            ]}
                          >
                            Member Price Applied
                          </Text>
                        </View>
                        {wishlistCount !== null && (
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                            onPress={toggleWishlist}
                            disabled={wishlistLoading}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isWishlisted ? "heart" : "heart-outline"}
                              size={14}
                              color={isWishlisted ? "#ef4444" : colors.textSec}
                            />
                            <Text
                              style={[
                                styles.priceLabel,
                                {
                                  color: isWishlisted
                                    ? "#ef4444"
                                    : colors.textSec,
                                },
                              ]}
                            >
                              {wishlistCount} Saved
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {/* Big Price Row */}
                    <View style={styles.bigPriceRow}>
                      <Text style={[styles.bigPrice, { color: Colors.sky }]}>
                        ₱{memberPrice.toLocaleString()}
                      </Text>
                      {variantDiscount > 0 && (
                        <>
                          <Text
                            style={[
                              styles.strikethroughPrice,
                              { color: colors.textSec },
                            ]}
                          >
                            ₱{srpPrice.toLocaleString()}
                          </Text>
                          <View style={styles.discountBadgeNew}>
                            <Text style={styles.discountBadgeTextNew}>
                              {variantDiscount}% OFF
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </>
                )
              })()}

              {/* Social Proof Row - Rating, Sold, PV */}
              <View style={styles.socialProofRow}>
                <View style={styles.ratingSmall}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    4.8
                  </Text>
                </View>
                <Text
                  style={[styles.socialProofDot, { color: colors.divider }]}
                >
                  •
                </Text>
                {product.soldCount > 0 && (
                  <>
                    <Text
                      style={[
                        styles.soldCountCompact,
                        { color: colors.textSec },
                      ]}
                    >
                      {product.soldCount} sold
                    </Text>
                    <Text
                      style={[styles.socialProofDot, { color: colors.divider }]}
                    >
                      •
                    </Text>
                  </>
                )}
                <Text style={[styles.pvText, { color: colors.textSec }]}>
                  PV {product.prodpv}
                </Text>
              </View>

              {/* Badges - Horizontal Chips */}
              {activeBadges.length > 0 && (
                <View style={styles.badgeChipsRow}>
                  {activeBadges.map((b) => (
                    <View
                      key={b.key}
                      style={[
                        styles.badgeChip,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(15, 23, 42, 0.5)"
                            : "rgba(240, 249, 255, 0.8)",
                        },
                      ]}
                    >
                      <Text
                        style={[styles.badgeChipText, { color: Colors.sky }]}
                      >
                        {b.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Gray Gap Separator */}
            <View style={{ height: 12, backgroundColor: "#ffffff" }} />

            {/* Product Name and Brand Section */}
            <View
              style={[styles.newNameSection, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.productNameNew, { color: colors.text }]}>
                {product.name}
              </Text>
              <View style={styles.brandSkuRow}>
                <Text style={[styles.brandText, { color: colors.textSec }]}>
                  {product.brand}
                </Text>
                <Text style={[styles.skuText, { color: colors.textSec }]}>
                  {" "}
                  • SKU: {product.id}
                </Text>
              </View>
              {/* Selected Variant Info */}
              {selectedVariant &&
                product.variants &&
                (() => {
                  const selectedVar = product.variants.find(
                    (v) => v.id === selectedVariant
                  )
                  if (selectedVar && (selectedVar.color || selectedVar.size)) {
                    return (
                      <View style={styles.selectedVariantInfoRow}>
                        {selectedVar.colorHex && selectedVar.images?.length ? (
                          <>
                            <View
                              style={[
                                styles.variantColorIndicator,
                                { backgroundColor: selectedVar.colorHex },
                              ]}
                            />
                            <Text
                              style={[
                                styles.selectedVariantText,
                                { color: colors.text },
                              ]}
                            >
                              {selectedVar.color || selectedVar.name}
                            </Text>
                          </>
                        ) : null}
                        {selectedVar.size && (
                          <Text
                            style={[
                              styles.selectedVariantText,
                              { color: colors.text },
                            ]}
                          >
                            {selectedVar.size}
                          </Text>
                        )}
                      </View>
                    )
                  }
                  return null
                })()}
            </View>

            {/* Gray Gap Separator */}
            <View style={{ height: 12, backgroundColor: "#ffffff" }} />

            {/* Delivery Information */}
            <View
              style={[styles.deliverySection, { backgroundColor: colors.card }]}
            >
              <View style={styles.deliveryRow}>
                <Ionicons name="car-outline" size={20} color={Colors.sky} />
                <View style={styles.deliveryInfo}>
                  <Text style={[styles.deliveryLabel, { color: colors.text }]}>
                    Standard Delivery
                  </Text>
                  <Text
                    style={[styles.deliveryDetails, { color: colors.textSec }]}
                  >
                    Estimated 3-5 days
                  </Text>
                </View>
              </View>
            </View>

            {/* Gray Gap Separator */}
            <View style={{ height: 12, backgroundColor: "#ffffff" }} />

            {/* Description & Specifications Wrapper */}
            {(!!product.description ||
              !!product.specifications ||
              !!product.material ||
              !!product.warranty ||
              product.pswidth ||
              product.pslenght ||
              product.psheight) && (
              <View
                style={[
                  styles.descriptionsWrapper,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
              >
                {/* Description */}
                {!!product.description && (
                  <View
                    style={[
                      styles.descriptionSection,
                      {
                        backgroundColor: colors.card,
                        borderBottomColor: colors.divider,
                        borderTopColor: colors.divider,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.descriptionHeader,
                        { backgroundColor: isDarkMode ? "#111827" : "#f9fafb" },
                      ]}
                      onPress={() =>
                        setDescriptionExpanded(!descriptionExpanded)
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.descriptionTitle,
                          { color: colors.text },
                        ]}
                      >
                        Description
                      </Text>
                      <Ionicons
                        name={
                          descriptionExpanded ? "chevron-up" : "chevron-down"
                        }
                        size={20}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    {descriptionExpanded && (
                      <View
                        style={[
                          styles.descriptionContent,
                          { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={styles.descriptionContentInner}>
                          {(() => {
                            try {
                              // Renders HTML descriptions (incl. ZQ products,
                              // whose description is an HTML spec table).
                              return (
                                <RenderHtml
                                  source={{
                                    html:
                                      product.description ||
                                      "<p>No description available</p>",
                                  }}
                                  contentWidth={SCREEN_WIDTH - 16}
                                  defaultTextProps={{ selectable: false }}
                                  tagsStyles={{
                                    body: {
                                      color: colors.text,
                                      fontSize: 14,
                                      lineHeight: 22,
                                    },
                                    div: {
                                      color: colors.text,
                                      fontSize: 14,
                                      lineHeight: 22,
                                    },
                                    span: {
                                      color: colors.text,
                                      fontSize: 14,
                                      lineHeight: 22,
                                    },
                                    h1: {
                                      color: colors.text,
                                      fontSize: 20,
                                      fontWeight: "800",
                                      marginTop: 12,
                                      marginBottom: 6,
                                    },
                                    h2: {
                                      color: colors.text,
                                      fontSize: 18,
                                      fontWeight: "800",
                                      marginTop: 12,
                                      marginBottom: 6,
                                    },
                                    h3: {
                                      color: colors.text,
                                      fontSize: 16,
                                      fontWeight: "700",
                                      marginTop: 12,
                                      marginBottom: 6,
                                    },
                                    h4: {
                                      color: colors.text,
                                      fontSize: 15,
                                      fontWeight: "600",
                                      marginTop: 10,
                                      marginBottom: 6,
                                    },
                                    h5: {
                                      color: colors.text,
                                      fontSize: 14,
                                      fontWeight: "600",
                                      marginTop: 8,
                                      marginBottom: 4,
                                    },
                                    h6: {
                                      color: colors.text,
                                      fontSize: 13,
                                      fontWeight: "600",
                                      marginTop: 8,
                                      marginBottom: 4,
                                    },
                                    p: {
                                      color: colors.text,
                                      fontSize: 14,
                                      lineHeight: 22,
                                      marginBottom: 10,
                                    },
                                    ul: { marginLeft: 20, marginBottom: 10 },
                                    ol: { marginLeft: 20, marginBottom: 10 },
                                    li: {
                                      color: colors.text,
                                      fontSize: 14,
                                      lineHeight: 22,
                                      marginBottom: 6,
                                    },
                                    hr: {
                                      backgroundColor: colors.divider,
                                      marginVertical: 12,
                                    },
                                    strong: { fontWeight: "700" },
                                    b: { fontWeight: "700" },
                                    em: { fontStyle: "italic" },
                                    i: { fontStyle: "italic" },
                                    u: { textDecorationLine: "underline" },
                                    br: { marginVertical: 2 },
                                    a: {
                                      color: Colors.sky,
                                      textDecorationLine: "underline",
                                    },
                                  }}
                                />
                              )
                            } catch (error) {
                              console.error(
                                "❌ [RenderHtml] Error rendering description:",
                                error
                              )
                              return (
                                <View
                                  style={[
                                    styles.descriptionContentInner,
                                    { padding: 12 },
                                  ]}
                                >
                                  <Text style={{ color: colors.text }}>
                                    Unable to display description
                                  </Text>
                                </View>
                              )
                            }
                          })()}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Specifications */}
                {(!!product.specifications ||
                  !!product.material ||
                  !!product.warranty ||
                  product.pswidth ||
                  product.pslenght ||
                  product.psheight) && (
                  <View
                    style={[
                      styles.specificationsSection,
                      {
                        backgroundColor: colors.card,
                        borderBottomColor: colors.divider,
                        borderTopColor: colors.divider,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.specificationsHeader,
                        { backgroundColor: isDarkMode ? "#111827" : "#f9fafb" },
                      ]}
                      onPress={() =>
                        setSpecificationsExpanded(!specificationsExpanded)
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.specificationsTitle,
                          { color: colors.text },
                        ]}
                      >
                        Specifications
                      </Text>
                      <Ionicons
                        name={
                          specificationsExpanded ? "chevron-up" : "chevron-down"
                        }
                        size={20}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    {specificationsExpanded && (
                      <View
                        style={[
                          styles.specificationsContent,
                          { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={styles.specificationsContentInner}>
                          {product.pswidth ||
                          product.pslenght ||
                          product.psheight ? (
                            <View style={styles.specRow}>
                              <Text
                                style={[
                                  styles.specLabel,
                                  { color: colors.textSec },
                                ]}
                              >
                                Dimensions:
                              </Text>
                              <Text
                                style={[
                                  styles.specValue,
                                  { color: colors.text },
                                ]}
                              >
                                {`${product.pswidth || "0"} cm x ${product.pslenght || "0"} cm x ${product.psheight || "0"} cm`}
                              </Text>
                            </View>
                          ) : null}
                          {product.material ? (
                            <View style={styles.specRow}>
                              <Text
                                style={[
                                  styles.specLabel,
                                  { color: colors.textSec },
                                ]}
                              >
                                Material:
                              </Text>
                              <Text
                                style={[
                                  styles.specValue,
                                  { color: colors.text },
                                ]}
                              >
                                {product.material}
                              </Text>
                            </View>
                          ) : null}
                          {product.warranty ? (
                            <View style={styles.specRow}>
                              <Text
                                style={[
                                  styles.specLabel,
                                  { color: colors.textSec },
                                ]}
                              >
                                Warranty:
                              </Text>
                              <Text
                                style={[
                                  styles.specValue,
                                  { color: colors.text },
                                ]}
                              >
                                {product.warranty}
                              </Text>
                            </View>
                          ) : null}
                          {product.specifications ? (
                            <View style={styles.specRow}>
                              <Text
                                style={[
                                  styles.specValue,
                                  { color: colors.text },
                                ]}
                              >
                                {product.specifications}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Product Rating - Shopee Style */}
            <View style={styles.ratingSection}>
              <View
                style={[
                  styles.ratingCard,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
              >
                {productReviews && productReviews.summary ? (
                  <>
                    {/* Rating Summary Header */}
                    <View
                      style={[
                        styles.ratingSummaryHeader,
                        {
                          backgroundColor: colors.card,
                          borderBottomColor: colors.divider,
                        },
                      ]}
                    >
                      <View style={styles.ratingScoreContainer}>
                        <Text
                          style={[
                            styles.ratingScoreLarge,
                            { color: colors.text },
                          ]}
                        >
                          {(productReviews.summary.average || 0 || 0).toFixed(
                            1
                          )}
                        </Text>
                        <View style={styles.ratingStarsLarge}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={
                                star <=
                                Math.round(productReviews.summary.average || 0)
                                  ? "star"
                                  : "star-outline"
                              }
                              size={20}
                              color={
                                star <=
                                Math.round(productReviews.summary.average || 0)
                                  ? "#fbbf24"
                                  : colors.divider
                              }
                            />
                          ))}
                        </View>
                      </View>
                      <View style={styles.ratingStats}>
                        <Text
                          style={[styles.ratingCount, { color: colors.text }]}
                        >
                          {productReviews.summary.count || 0} ratings
                        </Text>
                        <TouchableOpacity style={styles.viewAllButton}>
                          <Text
                            style={[styles.viewAllText, { color: Colors.sky }]}
                          >
                            See all
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.sky}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Rating Distribution */}
                    <View
                      style={[
                        styles.ratingDistribution,
                        {
                          backgroundColor: colors.card,
                          borderBottomColor: colors.divider,
                        },
                      ]}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          productReviews.reviews?.filter(
                            (r) => r.rating === rating
                          ).length || 0
                        const percentage =
                          productReviews.summary.count > 0
                            ? (count / productReviews.summary.count) * 100
                            : 0
                        return (
                          <View key={rating} style={styles.ratingBarRow}>
                            <Text
                              style={[
                                styles.ratingBarLabel,
                                { color: colors.text },
                              ]}
                            >
                              {rating}★
                            </Text>
                            <View
                              style={[
                                styles.ratingBarTrack,
                                { backgroundColor: colors.divider },
                              ]}
                            >
                              <View
                                style={[
                                  styles.ratingBarFill,
                                  { width: `${percentage}%` },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                styles.ratingBarCount,
                                { color: colors.text },
                              ]}
                            >
                              {count}
                            </Text>
                          </View>
                        )
                      })}
                    </View>

                    {/* Customer Reviews */}
                    {productReviews.reviews &&
                      productReviews.reviews.length > 0 && (
                        <View
                          style={[
                            styles.reviewsSection,
                            { backgroundColor: colors.card },
                          ]}
                        >
                          <View
                            style={[
                              styles.reviewsSectionHeader,
                              { borderBottomColor: colors.divider },
                            ]}
                          >
                            <Text
                              style={[
                                styles.reviewsSectionTitle,
                                { color: colors.text },
                              ]}
                            >
                              Customer Reviews
                            </Text>
                            <Text
                              style={[
                                styles.reviewsSectionCount,
                                { color: colors.textSec },
                              ]}
                            >
                              ({productReviews.reviews.length})
                            </Text>
                          </View>
                          {productReviews.reviews
                            .slice(0, 2)
                            .map((review, index) => (
                              <View
                                key={review.id}
                                style={[
                                  styles.reviewCard,
                                  {
                                    backgroundColor: colors.containerBg,
                                    borderColor: colors.divider,
                                  },
                                ]}
                              >
                                <View style={styles.reviewHeader}>
                                  <View style={styles.reviewerInfo}>
                                    <View style={styles.avatarContainer}>
                                      <Image
                                        source={{
                                          uri:
                                            review.customer_avatar ||
                                            "https://via.placeholder.com/40",
                                        }}
                                        style={styles.reviewAvatar}
                                        contentFit="cover"
                                        transition={200}
                                      />
                                    </View>
                                    <View style={styles.reviewerDetails}>
                                      <Text
                                        style={[
                                          styles.reviewCustomerName,
                                          { color: colors.text },
                                        ]}
                                      >
                                        {review.customer_name.charAt(0)}
                                        {review.customer_name
                                          .slice(1)
                                          .replace(/./g, "*")}
                                      </Text>
                                      <View style={styles.reviewRatingRow}>
                                        <View style={styles.reviewStars}>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                              key={star}
                                              name={
                                                star <= review.rating
                                                  ? "star"
                                                  : "star-outline"
                                              }
                                              size={12}
                                              color={
                                                star <= review.rating
                                                  ? "#fbbf24"
                                                  : colors.divider
                                              }
                                            />
                                          ))}
                                        </View>
                                        <Text
                                          style={[
                                            styles.reviewRatingText,
                                            { color: colors.textSec },
                                          ]}
                                        >
                                          {review.rating}.0
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                  <Text
                                    style={[
                                      styles.reviewDate,
                                      { color: colors.textSec },
                                    ]}
                                  >
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.reviewComment,
                                    { color: colors.text },
                                  ]}
                                >
                                  {review.review}
                                </Text>
                                {index <
                                  productReviews.reviews.slice(0, 2).length -
                                    1 && (
                                  <View
                                    style={[
                                      styles.reviewSeparator,
                                      { backgroundColor: colors.divider },
                                    ]}
                                  />
                                )}
                              </View>
                            ))}
                          {productReviews.reviews.length > 2 && (
                            <TouchableOpacity
                              style={[
                                styles.seeAllReviewsBtn,
                                {
                                  backgroundColor: colors.containerBg,
                                  borderTopColor: colors.divider,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.seeAllReviewsBtnText,
                                  { color: Colors.sky },
                                ]}
                              >
                                See all reviews ({productReviews.reviews.length}
                                )
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.sky}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                  </>
                ) : (
                  <>
                    {/* No Ratings State */}
                    <View
                      style={[
                        styles.noRatingContainer,
                        { backgroundColor: colors.card },
                      ]}
                    >
                      <View style={styles.noRatingScore}>
                        <Ionicons
                          name="star-outline"
                          size={24}
                          color={colors.divider}
                        />
                        <Text
                          style={[
                            styles.noRatingText,
                            { color: colors.textSec },
                          ]}
                        >
                          No ratings yet
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.firstReviewButton}>
                        <Text style={styles.firstReviewButtonText}>
                          Be the first to review
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Gray Gap Separator */}
            <View style={{ height: 12, backgroundColor: "#ffffff" }} />

            {/* Brand Information */}
            {brandProfile && (
              <View
                style={[styles.brandSection, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Shop Information
                </Text>
                <View
                  style={[
                    styles.brandCard,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        brandProfile.profile_picture ||
                        "https://via.placeholder.com/60",
                    }}
                    style={styles.brandLogo}
                    contentFit="contain"
                    transition={200}
                  />
                  <View style={styles.brandInfo}>
                    <View style={styles.brandHeader}>
                      <Text style={[styles.brandName, { color: colors.text }]}>
                        {brandProfile.name}
                      </Text>
                      <View
                        style={[
                          styles.onlineDot,
                          brandProfile.is_online
                            ? styles.onlineDotActive
                            : styles.onlineDotInactive,
                        ]}
                      />
                    </View>
                    <View style={styles.brandStats}>
                      <View style={styles.brandStat}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text
                          style={[styles.brandStatText, { color: colors.text }]}
                        >
                          {(brandProfile.overall_rating || 0).toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.brandStatDivider} />
                      <View style={styles.brandStat}>
                        <Text
                          style={[styles.brandStatText, { color: colors.text }]}
                        >
                          {brandProfile.total_reviews} reviews
                        </Text>
                      </View>
                      <View style={styles.brandStatDivider} />
                      <View style={styles.brandStat}>
                        <Text
                          style={[styles.brandStatText, { color: colors.text }]}
                        >
                          {brandProfile.total_products} products
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.chatButton,
                      { backgroundColor: isDarkMode ? "#111827" : "#f0f9ff" },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (product && onShopNavigate) {
                        onShopNavigate(
                          product.brandType,
                          brandProfile?.name || ""
                        )
                      }
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.sky}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Gray Gap Separator */}
            <View style={{ height: 0, backgroundColor: "#ffffff" }} />

            {/* Related Products */}
            {relatedProducts.length > 0 ? (
              <View
                style={[
                  styles.relatedSection,
                  { backgroundColor: colors.card },
                ]}
              >
                <View
                  style={[
                    styles.relatedHeader,
                    { borderBottomColor: colors.divider },
                  ]}
                >
                  <Ionicons name="grid-outline" size={15} color={Colors.sky} />
                  <Text style={[styles.relatedTitle, { color: colors.text }]}>
                    Related Products
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.relatedScroll}
                >
                  <View style={styles.relatedRow}>
                    {relatedProducts.map((p) => (
                      <View key={p.id} style={styles.relatedCard}>
                        <FeaturedItems
                          product={{
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
                          }}
                          token={token}
                          isWishlisted={
                            wishlistItems?.some(
                              (item) => item.product_id === p.id
                            ) || false
                          }
                          onPress={(id) => onProductPress?.(id)}
                          onWishlistToggle={onWishlistToggle}
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View
                style={[
                  styles.relatedSection,
                  {
                    backgroundColor: colors.card,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 16,
                  },
                ]}
              >
                <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>
                  No related products found
                </Text>
              </View>
            )}

            {/* You May Also Like Section - With Lazy Loading */}
            {youMayAlsoLike.length > 0 && (
              <View
                style={[
                  styles.youMayAlsoLikeSection,
                  { backgroundColor: colors.card },
                ]}
              >
                <View
                  style={[
                    styles.youMayAlsoLikeHeader,
                    {
                      borderTopColor: colors.divider,
                      borderBottomColor: colors.divider,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.youMayAlsoLikeBorder,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                  <Text
                    style={[styles.youMayAlsoLikeTitle, { color: colors.text }]}
                  >
                    You May Also Like
                  </Text>
                  <View
                    style={[
                      styles.youMayAlsoLikeBorder,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                </View>
                <View style={styles.youMayAlsoLikeMasonryGrid}>
                  <View style={styles.youMayAlsoLikeMasonryColumn}>
                    {youMayAlsoLike
                      .slice(0, visibleYouMayAlsoLikeCount)
                      .filter((_, i) => i % 2 === 0)
                      .map((p) => (
                        <View key={p.id} style={styles.youMayAlsoLikeItem}>
                          <ItemCard
                            product={p}
                            token={token}
                            isWishlisted={
                              wishlistItems?.some(
                                (item) => item.product_id === p.id
                              ) || false
                            }
                            onPress={(item) => onProductPress?.(item.id)}
                            onWishlistToggle={onWishlistToggle}
                            isDarkMode={isDarkMode}
                          />
                        </View>
                      ))}
                  </View>
                  <View style={styles.youMayAlsoLikeMasonryColumn}>
                    {youMayAlsoLike
                      .slice(0, visibleYouMayAlsoLikeCount)
                      .filter((_, i) => i % 2 === 1)
                      .map((p) => (
                        <View key={p.id} style={styles.youMayAlsoLikeItem}>
                          <ItemCard
                            product={p}
                            token={token}
                            isWishlisted={
                              wishlistItems?.some(
                                (item) => item.product_id === p.id
                              ) || false
                            }
                            onPress={(item) => onProductPress?.(item.id)}
                            onWishlistToggle={onWishlistToggle}
                            isDarkMode={isDarkMode}
                          />
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Buy Now Button - Fixed Bottom */}
          <LinearGradient
            colors={
              isDarkMode ? ["#0f172a", "#1e293b"] : ["#f0f9ff", "#f0fdf4"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buyNowContainer, { borderTopColor: colors.divider }]}
          >
            <View style={{ paddingTop: 8, paddingBottom: insets.bottom || 4 }}>
              {/* Button Row */}
              <View style={styles.buttonRow}>
                {/* Add to Cart Button */}
                <TouchableOpacity
                  style={[
                    styles.addToCartButton,
                    addingToCart && { opacity: 0.6 },
                  ]}
                  onPress={() => setShowAddToCartModal(true)}
                  activeOpacity={0.7}
                  disabled={addingToCart}
                >
                  <View style={styles.addToCartContent}>
                    {addingToCart ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons
                        name="cart-outline"
                        size={20}
                        color={Colors.white}
                      />
                    )}
                    <Text style={styles.addToCartText}>
                      {addingToCart ? "Processing..." : "Add to cart"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Buy Now Button */}
                <View style={styles.buyNowButtonContainer}>
                  <TouchableOpacity
                    style={styles.buyNowButton}
                    onPress={() => {
                      setShowBuyModal(true)
                      setQuantity(1)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.buyNowContent}>
                      <Ionicons name="flash" size={18} color={Colors.white} />
                      <View style={styles.buyNowTextContainer}>
                        <Text style={styles.buyNowTitle}>Buy Now</Text>
                        <Text style={styles.buyNowSubtitle}>
                          Limited stock • Fast shipping
                        </Text>
                      </View>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={Colors.white}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </>
      ) : (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#d1d5db" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      )}

      {/* Full Screen Image Slideshow Viewer */}
      <ImageViewerModal
        visible={showImageViewer}
        product={product}
        brandProfile={brandProfile}
        images={images}
        imagesWithVariants={imagesWithVariants}
        selectedVariant={selectedVariant}
        imageViewerIndex={imageViewerIndex}
        cartCount={cartCount}
        isWishlisted={isWishlisted}
        wishlistLoading={wishlistLoading}
        onWishlistToggle={toggleWishlist}
        onClose={() => setShowImageViewer(false)}
        onAddToCart={() => {
          console.log("Add to cart")
          setShowImageViewer(false)
        }}
        onBuyNow={() => {
          setShowBuyModal(true)
          setShowImageViewer(false)
          setQuantity(1)
        }}
        onSelectVariant={setSelectedVariant}
        onImageIndexChange={setImageViewerIndex}
        onProductPress={() => {
          setShowImageViewer(false)
        }}
        hasDiscount={hasDiscount}
      />

      {/* Old slideshow code is now in ImageViewerModal component - removed for clarity */}
      {false && (
        <View>
          {/* Header with Brand Info and Close */}
          <LinearGradient
            colors={["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.slideshowHeader, { paddingTop: insets.top + 8 }]}
          >
            <TouchableOpacity
              onPress={() => setShowImageViewer(false)}
              activeOpacity={0.7}
              style={styles.slideshowCloseBtn}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Brand/Seller Info */}
            <View style={styles.slideshowBrandInfo}>
              <Image
                source={{
                  uri:
                    brandProfile?.profile_picture ||
                    "https://via.placeholder.com/32",
                }}
                style={styles.slideshowBrandImage}
                contentFit="contain"
                transition={200}
              />
              <View style={styles.slideshowBrandText}>
                <Text style={styles.slideshowBrandName} numberOfLines={1}>
                  {product.brand || "Store"}
                </Text>
                {brandProfile && (
                  <View style={styles.slideshowRatingRow}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.slideshowRating}>
                      {(brandProfile.overall_rating || 0).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.slideshowShareBtn}
              activeOpacity={0.7}
              onPress={() => {
                console.log("Share product")
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={22}
                color={Colors.text}
              />
            </TouchableOpacity>
          </LinearGradient>

          {/* Main Image Carousel */}
          <View style={styles.slideshowImageWrapper}>
            <ScrollView
              ref={imageViewerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                )
                setImageViewerIndex(index)
                // Auto-select variant based on image index
                if (imagesWithVariants.length > index) {
                  const item = imagesWithVariants[index]
                  if (item.variantId !== null) {
                    setSelectedVariant(item.variantId)
                  }
                }
              }}
              style={styles.slideshowImageScroll}
            >
              {images.map((img, i) => (
                <View key={i} style={styles.slideshowImageContainer}>
                  {/* Image */}
                  <Image
                    source={{ uri: img }}
                    style={styles.slideshowImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Page Indicator */}
            <View style={styles.slideshowPageIndicator}>
              <Text style={styles.slideshowPageText}>
                {imageViewerIndex + 1}/{images.length}
              </Text>
            </View>
          </View>

          {/* Bottom Product Card */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0)", Colors.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.slideshowProductCard,
              { paddingBottom: insets.bottom + 12 },
            ]}
          >
            {/* Product Image Thumbnail and Info */}
            <View style={styles.slideshowCardContent}>
              {/* Thumbnail */}
              <Image
                source={{ uri: images[imageViewerIndex] }}
                style={styles.slideshowCardImage}
                contentFit="cover"
                transition={200}
              />

              {/* Product Details */}
              <View style={styles.slideshowCardDetails}>
                <Text style={styles.slideshowCardName} numberOfLines={2}>
                  {product.name}
                </Text>

                {/* Variant Label */}
                {selectedVariant && product.variants && (
                  <Text
                    style={styles.slideshowVariantLabelText}
                    numberOfLines={1}
                  >
                    {product.variants.find((v) => v.id === selectedVariant)
                      ?.color ||
                      product.variants.find((v) => v.id === selectedVariant)
                        ?.name ||
                      "Variant"}
                  </Text>
                )}

                {/* Pricing */}
                <View style={styles.slideshowCardPricing}>
                  <Text style={styles.slideshowCardPrice}>
                    ₱
                    {(selectedVariant
                      ? (product.variants?.find((v) => v.id === selectedVariant)
                          ?.priceMember ?? product.priceMember)
                      : product.priceMember
                    ).toLocaleString()}
                  </Text>
                  {(selectedVariant
                    ? (product.variants?.find((v) => v.id === selectedVariant)
                        ?.priceSrp ?? 0)
                    : product.priceSrp) >
                    (selectedVariant
                      ? (product.variants?.find((v) => v.id === selectedVariant)
                          ?.priceMember ?? 0)
                      : product.priceMember) && (
                    <Text style={styles.slideshowCardOriginalPrice}>
                      ₱
                      {(selectedVariant
                        ? (product.variants?.find(
                            (v) => v.id === selectedVariant
                          )?.priceSrp ?? 0)
                        : product.priceSrp
                      ).toLocaleString()}
                    </Text>
                  )}
                </View>

                {/* PV and Sold Count */}
                <View style={styles.slideshowCardMetaRow}>
                  {product.prodpv > 0 && (
                    <View style={styles.slideshowCardMeta}>
                      <Ionicons name="star" size={12} color={Colors.sky} />
                      <Text style={styles.slideshowCardMetaText}>
                        PV {product.prodpv}
                      </Text>
                    </View>
                  )}
                  {product.soldCount > 0 && (
                    <View style={styles.slideshowCardMeta}>
                      <Ionicons
                        name="bag-check-outline"
                        size={12}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.slideshowCardMetaText}>
                        {product.soldCount} sold
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <View style={styles.slideshowVariantsSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.slideshowVariantsScroll}
                >
                  {product.variants.map((variant, idx) => (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.slideshowVariantOption,
                        selectedVariant === variant.id &&
                          styles.slideshowVariantOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedVariant(variant.id)
                        // Scroll to the variant's image in the gallery
                        const variantIndex = imagesWithVariants.findIndex(
                          (item) => item.variantId === variant.id
                        )
                        if (variantIndex >= 0) {
                          setImageViewerIndex(variantIndex)
                          imageViewerScrollRef.current?.scrollTo({
                            x: variantIndex * SCREEN_WIDTH,
                            animated: true,
                          })
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {variant.images && variant.images.length > 0 ? (
                        <Image
                          source={{ uri: variant.images[0] }}
                          style={styles.slideshowVariantImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : variant.colorHex ? (
                        <View
                          style={[
                            styles.slideshowVariantColor,
                            { backgroundColor: variant.colorHex },
                          ]}
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={20}
                          color="#d1d5db"
                        />
                      )}
                      {selectedVariant === variant.id && (
                        <View style={styles.slideshowVariantCheck}>
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={Colors.white}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.slideshowButtonRow}>
              <TouchableOpacity
                style={styles.slideshowAddToCartBtn}
                activeOpacity={0.7}
                onPress={() => {
                  console.log("Add to cart")
                  setShowImageViewer(false)
                }}
              >
                <Ionicons name="cart-outline" size={20} color="#f97316" />
                <Text style={styles.slideshowAddToCartText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.slideshowBuyNowBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setShowBuyModal(true)
                  setShowImageViewer(false)
                  setQuantity(1)
                }}
              >
                <Ionicons name="flash" size={18} color={Colors.white} />
                <Text style={styles.slideshowBuyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      <BuyNowModal
        visible={showBuyModal}
        product={product}
        images={images}
        selectedVariant={selectedVariant}
        quantity={quantity}
        onClose={() => setShowBuyModal(false)}
        onSelectVariant={setSelectedVariant}
        onQuantityChange={setQuantity}
        onCheckout={() => {
          setShowBuyModal(false)
          const variant = product?.variants?.find(
            (v) => v.id === selectedVariant
          )
          onCheckout?.(product, quantity, variant)
        }}
        onAddToCart={addToCart}
        loading={addingToCart}
        isDarkMode={isDarkMode}
      />

      <AddToCartModal
        visible={showAddToCartModal}
        product={product}
        images={images}
        selectedVariant={selectedVariant}
        quantity={quantity}
        isDarkMode={isDarkMode}
        onClose={() => setShowAddToCartModal(false)}
        onSelectVariant={setSelectedVariant}
        onQuantityChange={setQuantity}
        onAddToCart={addToCart}
        onAnimateAddToCart={animateAddToCart}
        onCheckout={() => {
          setShowAddToCartModal(false)
          const variant = product?.variants?.find(
            (v) => v.id === selectedVariant
          )
          onCheckout?.(product, quantity, variant)
        }}
        loading={addingToCart}
      />

      {/* Animated Image Overlay for Add to Cart Animation */}
      {showAnimatedImage && images.length > 0 && (
        <Animated.Image
          source={{ uri: images[activeImage] }}
          style={[
            {
              position: "absolute",
              width: SCREEN_WIDTH * 0.6,
              height: SCREEN_WIDTH * 0.6,
              top: SCREEN_WIDTH / 2 - (SCREEN_WIDTH * 0.6) / 2,
              left: SCREEN_WIDTH / 2 - (SCREEN_WIDTH * 0.6) / 2,
              zIndex: 999,
              transform: [
                { translateX: imageAnimX },
                { translateY: imageAnimY },
                { scale: imageAnimScale },
              ],
              opacity: imageAnimOpacity,
            },
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  )
}
