// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
  Share,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import {
  productService,
  type ProductReviewsResponse,
} from "../services/productService"
import { authService } from "../services/authService"
import { userBehaviorService } from "../services/userBehaviorService"
import { useProductDetail } from "../hooks/query/useProductDetail"
import { useRelatedProducts } from "../hooks/query/useRelatedProducts"
import { useShowcaseProducts } from "../hooks/query/useShowcaseProducts"
import ImageViewerModal from "../components/Items/ImageViewerModal"
import BuyNowModal from "../components/Items/BuyNowModal"
import AddToCartModal from "../components/Items/AddToCartModal"
import { ProductDetailSkeleton } from "../components/SkeletonLoader/SkeletonLoader"
import ProductVariantStrip from "../components/ProductVariantStrip/ProductVariantStrip"
import VariantImageViewer from "../components/VariantImageViewer/VariantImageViewer"
import ProductGallery, {
  type ProductGalleryHandle,
} from "../components/ProductGallery/ProductGallery"
import ProductDescription from "../components/ProductDescription/ProductDescription"
import YouMayAlsoLike from "../components/YouMayAlsoLike/YouMayAlsoLike"
import RelatedProducts from "../components/RelatedProducts/RelatedProducts"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import { getDisplayPricing } from "../utils/pricing"
import { guestCartService } from "../services/guestCartService"
import Toast from "react-native-toast-message"
import styles from "../styles/ProductDetailScreen.styles"

const SCREEN_WIDTH = Dimensions.get("window").width

// Section tabs shown in the sticky header. `key` matches the onLayout key used
// to record each section's scroll offset (see sectionOffsets).
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "description", label: "Description" },
  { key: "reviews", label: "Reviews" },
  { key: "recommendation", label: "Recommendation" },
] as const

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
  /** Guest-mode login gate — opens the auth flow for account-only actions. */
  onRequestLogin?: () => void
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
  onRequestLogin,
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
  const { data: product = null, isLoading: loading } = useProductDetail({
    productId,
    token,
    isZq,
  })

  // Server-ranked related products (GET /products/{id}/related) — public, cached
  // per product id. Replaces the old brand-shuffle fetch in the effect below.
  const { data: relatedProducts = [], isLoading: relatedLoading } =
    useRelatedProducts({
      productId,
      token,
      limit: 8,
    })

  // "You May Also Like" feed — the cached, per_page-bounded random showcase
  // (shared with the home rails) instead of fetching the entire catalog. Cached
  // for a few minutes, so revisiting products doesn't refetch.
  const { data: showcaseFeed = [] } = useShowcaseProducts({ token, count: 40 })
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [productReviews, setProductReviews] =
    useState<ProductReviewsResponse | null>(null)
  // The focused image URL for the fly-to-cart animation overlay. The gallery's
  // active index itself now lives inside ProductGallery (so swiping doesn't
  // re-render this screen); we only capture the image when the animation starts.
  const [animImage, setAnimImage] = useState<string | null>(null)
  // Expanded by default — the description drives purchase decisions, so show it
  // immediately (the header still toggles collapse for users who want it hidden).
  const [descriptionExpanded, setDescriptionExpanded] = useState(true)
  const [specificationsExpanded, setSpecificationsExpanded] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [imageViewerIndex, setImageViewerIndex] = useState(0)
  const [showVariantViewer, setShowVariantViewer] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const galleryRef = useRef<ProductGalleryHandle>(null)
  // Latest focused gallery index, updated via ProductGallery's onIndexChange
  // (ref-only, no re-render) — read when starting the fly-to-cart animation.
  const currentImageIndexRef = useRef(0)
  const imageAnimX = useState(() => new Animated.Value(0))[0]
  const imageAnimY = useState(() => new Animated.Value(0))[0]
  const imageAnimScale = useState(() => new Animated.Value(1))[0]
  const imageAnimOpacity = useState(() => new Animated.Value(0))[0]
  const [showAnimatedImage, setShowAnimatedImage] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  // Derived from the cached showcase feed (minus the current product) — no local
  // state/fetch. The compiler memoizes the filter; it's ≤40 items regardless.
  const youMayAlsoLike = showcaseFeed.filter((c) => c.id !== productId)
  const [visibleYouMayAlsoLikeCount, setVisibleYouMayAlsoLikeCount] =
    useState(8)
  const [wishlistCount, setWishlistCount] = useState<number | null>(null)
  const [optimisticCartCount, setOptimisticCartCount] = useState(0)

  // Sticky section-tab navigation. `activeTab` drives the highlight; the sticky
  // header measures its own height (headerH) so tab taps scroll the target
  // section to sit just below the header. sectionOffsets records each section's
  // y within the scroll content (via onLayout) for tap-to-scroll + scroll-spy.
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [headerH, setHeaderH] = useState(insets.top + 96)
  const sectionOffsets = useRef<{ [key: string]: number }>({})
  // While a tab-tap-driven scroll animates, the scroll-spy is suppressed so the
  // highlight doesn't flicker through the sections it passes (e.g. tapping
  // Reviews briefly showing Description). Cleared when the scroll settles.
  const isTabScrollingRef = useRef(false)
  const tabScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The search+tabs bar is hidden at the top of the page and slides/fades in
  // once the user scrolls down past SHOW_BAR_AFTER (the immersive gallery keeps
  // its own floating buttons for the un-scrolled state).
  const [showBar, setShowBar] = useState(false)
  const barTranslateY = useState(() => new Animated.Value(-160))[0]
  const barOpacity = useState(() => new Animated.Value(0))[0]

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
    setVisibleYouMayAlsoLikeCount(8)
    setBrandProfile(null)
    setDescriptionExpanded(true)
    setSpecificationsExpanded(false)
    setSelectedVariant(null)
    setActiveTab("overview")
    setShowBar(false)
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showImageViewer) {
          setShowImageViewer(false)
          return true
        }
        if (showBuyModal) {
          setShowBuyModal(false)
          return true
        }
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

  // Imperative resets (scroll position + bar animation) when the product
  // changes — external-system sync, correct to keep in an effect. React state
  // resets are handled during render above (prevProductId).
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
    barTranslateY.setValue(-160)
    barOpacity.setValue(0)
  }, [productId, barTranslateY, barOpacity])

  // When the product (from React Query) is available, run cascading fetches.
  useEffect(() => {
    const data = product
    if (!data) return

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

    // Related products come from useRelatedProducts and "You May Also Like" from
    // useShowcaseProducts (both cached React Query) — no fetches here.

    return () => {
      active = false
    }
    // Keyed on product?.id (not the product object): a React Query background
    // refetch hands back a new object with the same id, and we don't want to
    // re-run the brand/reviews/tracking fetches in that case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, productId, token])

  // Create image list with variant mapping (unique images only). The main
  // gallery shows EVERYTHING — variant photos first, then the product images.
  // (Variant-only viewing lives in the VariantImageViewer popup.)
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

  // Focus a gallery image: update the active image + matching variant. Called
  // live from onScroll so the strip tracks the swipe with no lag, guarded so it
  // fires once per image crossing (not every frame). The variant strip centers
  // itself off the selectedVariant prop, so no imperative call is needed here.
  // Variant focus coming FROM the gallery (a swipe landed on a variant image).
  // Updating selectedVariant here keeps the price + variant strip in sync.
  const handleVariantFocus = (variantId: number) => {
    setSelectedVariant(variantId)
  }

  // Select a variant from the strip: update selection and drive the gallery to
  // that variant's image via its imperative handle (gallery owns its own scroll).
  const handleSelectVariant = (variantId: number) => {
    setSelectedVariant(variantId)
    const idx = imagesWithVariants.findIndex(
      (item) => item.variantId === variantId
    )
    if (idx >= 0) galleryRef.current?.scrollToIndex(idx)
  }

  // Tap the Selected-variation thumbnail: open the variant-only swipable popup
  // (shows just the variation images — not the full product gallery).
  const handlePressSelectedVariantImage = () => {
    setShowVariantViewer(true)
  }

  // Tap a variation BUTTON: select it, and when that variant has its own
  // photos, pop up the variant-only viewer (variants[].images — the product's
  // general images are never included). Photo-less variants just select.
  const handleVariantButtonPress = (variantId: number) => {
    handleSelectVariant(variantId)
    const tapped = product?.variants?.find((v) => v.id === variantId)
    if (tapped?.images?.length) {
      setShowVariantViewer(true)
    }
  }

  // Tap a gallery image: open the full-screen viewer at that index. (The gallery
  // itself handles scrolling/variant-sync for the tapped image internally.)
  const handleOpenViewer = (index: number) => {
    setImageViewerIndex(index)
    setShowImageViewer(true)
  }

  // Tap a tab → scroll its section to just under the sticky header. Lock the
  // highlight to the tapped tab for the duration of the animated scroll so the
  // scroll-spy doesn't flip it to the sections we pass through on the way.
  const handleTabPress = (key: string) => {
    setActiveTab(key)
    isTabScrollingRef.current = true
    if (tabScrollTimeoutRef.current) clearTimeout(tabScrollTimeoutRef.current)
    tabScrollTimeoutRef.current = setTimeout(() => {
      isTabScrollingRef.current = false
    }, 550)
    const y = sectionOffsets.current[key] ?? 0
    scrollRef.current?.scrollTo({ y: Math.max(0, y - headerH), animated: true })
  }

  // Guests see SRP only, so they never show a member discount badge.
  const hasDiscount =
    product && token
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

    // Reveal the search+tabs bar only once scrolled away from the very top.
    const shouldShowBar = scrollY > 80
    if (shouldShowBar !== showBar) setShowBar(shouldShowBar)

    // Scroll-spy: highlight the tab whose section has reached just below the
    // sticky header (the deepest section we've scrolled past). Skipped while a
    // tab-tap scroll is animating so the highlight stays on the tapped tab.
    if (!isTabScrollingRef.current) {
      const probe = scrollY + headerH + 8
      let current = "overview"
      let best = -Infinity
      for (const t of TABS) {
        const off = sectionOffsets.current[t.key]
        if (off != null && off <= probe && off > best) {
          best = off
          current = t.key
        }
      }
      if (current !== activeTab) setActiveTab(current)
    }

    // Auto-load more items when user scrolls near bottom
    if (contentHeight - scrollY - scrollViewHeight < 500) {
      if (visibleYouMayAlsoLikeCount < youMayAlsoLike.length) {
        setVisibleYouMayAlsoLikeCount((prev) =>
          Math.min(prev + 8, youMayAlsoLike.length)
        )
      }
    }
  }

  // Slide + fade the search/tabs bar in when scrolled, out when back at the top.
  // Hidden offset tracks the measured bar height so it fully clears the screen.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(barTranslateY, {
        toValue: showBar ? 0 : -(headerH + 8),
        duration: showBar ? 280 : 200,
        easing: showBar ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(barOpacity, {
        toValue: showBar ? 1 : 0,
        duration: showBar ? 220 : 160,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start()
  }, [showBar, headerH, barTranslateY, barOpacity])

  const addToCart = async (cartData: {
    product_id: number
    variant_id?: number
    quantity: number
    selected_color?: string | null
    selected_size?: string | null
    selected_type?: string | null
  }) => {
    // Guests add to the local on-device cart at SRP (no server, no token).
    if (!token) {
      const variant =
        cartData.variant_id && product?.variants
          ? product.variants.find((v: any) => v.id === cartData.variant_id)
          : null
      const unitSrp = variant?.priceSrp ?? product?.priceSrp ?? 0
      try {
        await guestCartService.addItem({
          productId: cartData.product_id,
          productName: product?.name || "",
          productImage: product?.image || product?.images?.[0],
          brandName: product?.brand,
          unitPriceSrp: unitSrp,
          pv: variant?.prodpv ?? product?.prodpv ?? 0,
          quantity: cartData.quantity,
          variantId: cartData.variant_id ?? null,
          variantName: variant?.name ?? null,
          variantColor: cartData.selected_color ?? variant?.color ?? null,
          variantSize: cartData.selected_size ?? variant?.name ?? null,
          variantImage: variant?.images?.[0] ?? null,
        })
        setShowAddToCartModal(false)
        Toast.show({
          type: "success",
          text1: "Added to cart",
          text2: "Item saved to your cart",
        })
        onCartUpdate?.()
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add item to cart",
        })
      }
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

        // Track cart add behavior — include category/brand so it boosts the
        // user-behavior recommendation feed (the "golden rule").
        userBehaviorService
          .trackBehavior(
            token,
            "cart_add",
            cartData.product_id,
            product?.catid,
            product?.brandType
          )
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

    // Capture the currently-focused gallery image for the fly-to-cart overlay
    // (the live index is tracked in a ref by ProductGallery — no re-render).
    setAnimImage(images[currentImageIndexRef.current] || images[0] || null)
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
      // Guest tapped the heart — open login if we can, else hint.
      if (onRequestLogin) {
        onRequestLogin()
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please log in to add items to wishlist",
        })
      }
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

  // Plain object — React Compiler auto-memoizes it (reactCompiler is enabled in
  // app.json), so manual useMemo is unnecessary and would disable compilation.
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

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {loading ? (
        <ProductDetailSkeleton isDarkMode={isDarkMode} />
      ) : product ? (
        <>
          {/* Search + section tabs bar — hidden at the top, slides/fades in on
              scroll. Measures its own height so tab taps land sections beneath
              it and the hidden offset fully clears the screen. */}
          <Animated.View
            style={[
              styles.topBar,
              {
                backgroundColor: colors.card,
                paddingTop: insets.top,
                borderBottomColor: colors.divider,
                transform: [{ translateY: barTranslateY }],
                opacity: barOpacity,
              },
            ]}
            pointerEvents={showBar ? "auto" : "none"}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
          >
            <View style={styles.topBarRow}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.topBarIconBtn}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>

              {/* Search field — opens the search screen (keeps the immersive
                  product page free of a keyboard). */}
              <TouchableOpacity
                style={[
                  styles.searchField,
                  {
                    backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9",
                    borderColor: colors.divider,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => onSearch?.()}
              >
                <Ionicons name="search" size={16} color={colors.textSec} />
                <Text
                  style={[styles.searchPlaceholder, { color: colors.textSec }]}
                  numberOfLines={1}
                >
                  Search products
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareProduct}
                style={styles.topBarIconBtn}
                hitSlop={8}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onNavigateToCart}
                style={styles.topBarIconBtn}
                hitSlop={8}
              >
                <Ionicons name="cart-outline" size={21} color={colors.text} />
                {cartCount + optimisticCartCount > 0 && (
                  <View style={styles.topBarBadge}>
                    <Text style={styles.topBarBadgeText}>
                      {cartCount + optimisticCartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleWishlist}
                disabled={wishlistLoading}
                style={styles.topBarIconBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={21}
                  color={isWishlisted ? "#ef4444" : colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Section tabs — horizontally scrollable so longer labels
                ("Recommendation") aren't truncated on narrow screens. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBar}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.key
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItem}
                    onPress={() => handleTabPress(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: active ? Colors.sky : colors.textSec },
                        active && styles.tabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={[
                        styles.tabIndicator,
                        active && { backgroundColor: Colors.sky },
                      ]}
                    />
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
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
            onScrollBeginDrag={() => {
              // User took over — resume the scroll-spy immediately.
              isTabScrollingRef.current = false
              if (tabScrollTimeoutRef.current) {
                clearTimeout(tabScrollTimeoutRef.current)
                tabScrollTimeoutRef.current = null
              }
            }}
            onMomentumScrollEnd={() => {
              isTabScrollingRef.current = false
            }}
          >
            {/* Image Gallery — pager + counter + thumbnails own activeImage
                internally, so swiping re-renders only ProductGallery (not this
                whole screen). key={product.id} resets it on product change.
                Floating buttons serve the immersive top state; the search/tabs
                bar slides in over them once the user scrolls down. */}
            <View
              style={{ position: "relative" }}
              onLayout={(e) => {
                sectionOffsets.current.overview = e.nativeEvent.layout.y
              }}
            >
              <ProductGallery
                ref={galleryRef}
                key={product.id}
                images={images}
                imagesWithVariants={imagesWithVariants}
                isDarkMode={isDarkMode}
                onVariantFocus={handleVariantFocus}
                onOpenViewer={handleOpenViewer}
                onIndexChange={(i) => {
                  currentImageIndexRef.current = i
                }}
              />
              {/* Back Button */}
              <TouchableOpacity
                onPress={onBack}
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

            {/* Variations — text buttons + Selected card (tap image → viewer) */}
            {product.variants && product.variants.length > 0 && (
              <ProductVariantStrip
                variants={product.variants}
                selectedVariantId={selectedVariant}
                isDarkMode={isDarkMode}
                onSelectVariant={handleVariantButtonPress}
                onPressSelectedImage={handlePressSelectedVariantImage}
              />
            )}

            {/* Price Section - Shopee Style (Price First, Large & Bold) */}
            <View
              style={[styles.newPriceSection, { backgroundColor: colors.card }]}
            >
              {(() => {
                let memberPrice = product.priceMember ?? 0
                let srpPrice = product.priceSrp ?? 0

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

                // Guests (no token) see SRP only, with no member discount/badge.
                const pricing = getDisplayPricing(
                  { memberPrice, originalPrice: srpPrice },
                  !token
                )
                // `memberPrice` drives the big price; for guests it becomes SRP.
                memberPrice = pricing.displayPrice
                const variantDiscount = pricing.discountPct

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
            <View style={{ height: 12, backgroundColor: colors.bg }} />

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
            <View style={{ height: 12, backgroundColor: colors.bg }} />

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
            <View style={{ height: 12, backgroundColor: colors.bg }} />

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
                onLayout={(e) => {
                  sectionOffsets.current.description = e.nativeEvent.layout.y
                }}
              >
                {/* Description (memoized component — RenderHtml no longer
                    rebuilds on every swipe/variant change). */}
                {!!product.description && (
                  <ProductDescription
                    description={product.description}
                    isDarkMode={isDarkMode}
                  />
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
            <View
              style={styles.ratingSection}
              onLayout={(e) => {
                sectionOffsets.current.reviews = e.nativeEvent.layout.y
              }}
            >
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
            <View style={{ height: 12, backgroundColor: colors.bg }} />

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
            <View
              style={{ height: 0, backgroundColor: colors.bg }}
              onLayout={(e) => {
                sectionOffsets.current.recommendation = e.nativeEvent.layout.y
              }}
            />

            {/* Related Products (memoized — won't re-render on swipe) */}
            <RelatedProducts
              products={relatedProducts}
              loading={relatedLoading}
              token={token}
              wishlistItems={wishlistItems}
              isDarkMode={isDarkMode}
              onProductPress={onProductPress}
              onWishlistToggle={onWishlistToggle}
            />

            {/* You May Also Like (memoized — won't re-render on swipe; the
                slice + wishlist lookup are computed inside on stable props). */}
            <YouMayAlsoLike
              products={youMayAlsoLike}
              visibleCount={visibleYouMayAlsoLikeCount}
              token={token}
              wishlistItems={wishlistItems}
              isDarkMode={isDarkMode}
              onProductPress={onProductPress}
              onWishlistToggle={onWishlistToggle}
            />
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

      {/* Variant-only swipable popup (from the Selected card's thumbnail) */}
      {product && (
        <VariantImageViewer
          visible={showVariantViewer}
          variants={product.variants ?? []}
          selectedVariantId={selectedVariant}
          onClose={() => setShowVariantViewer(false)}
          onSelectVariant={handleSelectVariant}
        />
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
      {showAnimatedImage && animImage && (
        <Animated.Image
          source={{ uri: animImage }}
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
