// @ts-nocheck
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  BackHandler,
  Clipboard,
  Linking,
  AppState,
  Platform,
} from "react-native"
import type { AppStateStatus } from "react-native"
import * as SystemUI from "expo-system-ui"
import * as NavigationBar from "expo-navigation-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import {
  NavigationProvider,
  NavigationContextType,
} from "../context/NavigationContext"
import { AppContextProvider } from "../context/AppContext"
import { useModalStore } from "../store/modalStore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Colors } from "../constants/colors"
import { getBadgeImage } from "../constants/tierConfig"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import { productService, type ProductCard } from "../services/productService"
import { referralService } from "../services/referralService"
import TabNavigator from "./TabNavigator"
import SearchScreen from "../screen/SearchScreen"
import SearchResultScreen from "../screen/SearchResultScreen"
import ProductDetailScreen from "../screen/ProductDetailScreen"
import CartScreen from "../screen/CartScreen"
import AffiliateReferralModal from "../components/Referral/AffiliateReferralModal"
import ReferralSignupFlow from "../components/ModalHost/ReferralSignupFlow"
import CheckoutScreen from "../screen/CheckoutScreen"
import OrderSuccessScreen from "../screen/OrderSuccessScreen"
import PaymentWebViewScreen from "../screen/PaymentWebViewScreen"
import PurchasesScreen from "../screen/PurchasesScreen"
import PaymentSuccessScreen from "../screen/PaymentSuccessScreen"
import PaymentCancelScreen from "../screen/PaymentCancelScreen"
import ShippingAddressSelectionScreen from "../screen/ShippingAddressSelectionScreen"
import ModalHost from "../components/ModalHost/ModalHost"
import AccountOverlayHost from "../components/ModalHost/AccountOverlayHost"
import { orderService } from "../services/orderService"
import Toast from "react-native-toast-message"
import { useNotifications } from "../hooks/useNotifications"
import { useFirebaseMessaging } from "../hooks/useFirebaseMessaging"
import { useWishlist } from "../hooks/useWishlist"

type TabKey =
  | "home"
  | "wishlist"
  | "shop"
  | "notification"
  | "profile"
  | "settings"

const CACHE_PREFIX = "apsara_cache:"
const cacheUtils = {
  async init() {
    return Promise.resolve()
  },
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.log(`Cache read failed [${key}]:`, error)
      return null
    }
  },
  async set(key: string, data: any) {
    try {
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data))
    } catch (error) {
      console.log(`Cache write failed [${key}]:`, error)
    }
  },
}

interface User {
  id: string
  email: string
  name: string
  username?: string
  avatar_url?: string
  badge_name?: string
  badge_image?: string | any
  rank?: number
  monthly_activation?: {
    current_month_pv: number
    threshold_pv: number
    remaining_pv: number
  }
}

function extractCount(data: any): number {
  // Calculate total quantity (sum of all item quantities)
  if (Array.isArray(data?.cart_items)) {
    return data.cart_items.reduce((sum: number, item: any) => {
      const qty =
        typeof item?.quantity === "number"
          ? item.quantity
          : typeof item?.qty === "number"
            ? item.qty
            : typeof item?.ci_quantity === "number"
              ? item.ci_quantity
              : 1
      return sum + qty
    }, 0)
  }

  // Fallback: Try to use total quantity fields
  if (typeof data?.total_items === "number") return data.total_items
  if (typeof data?.total === "number") return data.total
  if (typeof data?.count === "number") return data.count

  // Last resort: count number of items
  if (Array.isArray(data?.wishlist_items)) return data.wishlist_items.length
  if (Array.isArray(data?.data)) return data.data.length
  if (Array.isArray(data?.items)) return data.items.length
  if (Array.isArray(data)) return data.length
  return 0
}

interface CategoryItem {
  id: number
  name: string
  image?: string | null
}

interface BrandItem {
  id: number
  name: string
  image?: string | null
  brand_image?: string
  total_products?: number
}

interface RoomType {
  room_id: number
  room_name: string
  image: string
  count: number
}

// Pure helper — normalizes an arbitrary status string to a known purchase status.
// Module-level so it is stable and usable by callbacks defined early in the component.
const normalizePurchaseStatus = (status?: string) => {
  const s = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
  if (s === "to_ship") return "shipped" as const
  if (s === "out_for_delivery") return "to_receive" as const
  if (s === "to_receive" || s === "toreceive") return "to_receive" as const
  if (
    s === "pending" ||
    s === "paid" ||
    s === "processing" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "cancelled" ||
    s === "return"
  )
    return s
  return "pending" as const
}

export default function AppNavigator({
  user,
  token,
  onLogout,
  onUserUpdate,
  productSlugFromDeepLink,
  onProductDeepLinkHandled,
}: {
  user?: User | null
  token?: string | null
  onLogout?: () => void
  /** Merge a partial update into the global user (avatar, etc.) + persist. */
  onUserUpdate?: (patch: Record<string, any>) => void
  productSlugFromDeepLink?: string | null
  onProductDeepLinkHandled?: () => void
}) {
  console.log("[AppNavigator] User object received:", {
    name: user?.name,
    badge_name: user?.badge_name,
    badge_image: user?.badge_image,
    avatar_url: user?.avatar_url,
    fullUser: user,
  })

  // Customer support chat overlay now lives in the Zustand modal store
  // (openChatSupport / chatSupportOpen) and renders via ModalHost — see
  // src/store/modalStore.ts. Removed from here so opening it no longer
  // re-renders this navigator.

  // Purchases overlay state — declared before handleNotificationPressed (which
  // sets it when a push notification is tapped).
  const [showPurchases, setShowPurchases] = useState(false)
  const [purchasesStatus, setPurchasesStatus] = useState<
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "to_receive"
    | "delivered"
    | "cancelled"
    | "return"
  >("pending")
  const [purchasesInitialOrderId, setPurchasesInitialOrderId] = useState<
    string | undefined
  >(undefined)

  // Callback when notification is clicked
  const handleNotificationPressed = useCallback(
    (checkoutId: string, status: string) => {
      console.log("[AppNavigator] Notification pressed:", {
        checkoutId,
        status,
      })
      setPurchasesStatus(normalizePurchaseStatus(status))
      setPurchasesInitialOrderId(checkoutId)
      setShowPurchases(true)
    },
    []
  )

  // Initialize Firebase messaging with notification handler
  useFirebaseMessaging(token || "", user?.id || "", handleNotificationPressed)

  // Initialize real-time notifications
  // Side effects only (Pusher subscription); returned values are unused here.
  useNotifications(user?.id || "", token || "")

  // Opens info-page / AF Wallet overlays via the Zustand modal store.
  // Info-page + history overlays are opened directly from the screens that need
  // them (ModalHost / AccountOverlayHost call the store), so only the wallet
  // openers remain wired through AppNavigator's context callbacks.
  const openWalletPage = useModalStore((s) => s.openWalletPage)
  const openReferralIntro = useModalStore((s) => s.openReferralIntro)

  const [activeTab, setActiveTab] = useState<TabKey>("home")
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Sync the Android device navigation bar (the ☰ ○ ◁ strip) to the app theme.
  // Edge-to-edge keeps the bar transparent, so the BACKGROUND comes from the
  // window background (expo-system-ui) and the BUTTON ICONS contrast is set via
  // expo-navigation-bar's setStyle ("light" = light icons for a dark bar).
  useEffect(() => {
    if (Platform.OS !== "android") return
    const barColor = isDarkMode ? "#0f172a" : "#ffffff"
    SystemUI.setBackgroundColorAsync(barColor).catch(() => {})
    try {
      NavigationBar.setStyle(isDarkMode ? "light" : "dark")
    } catch {}
  }, [isDarkMode])
  const [searchVisible, setSearchVisible] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderSuccess, setShowOrderSuccess] = useState(false)
  const [showPaymentWebView, setShowPaymentWebView] = useState(false)
  const [checkoutOrderData, setCheckoutOrderData] = useState(null)
  const [paymentCheckoutUrl, setPaymentCheckoutUrl] = useState("")
  const [checkoutItem, setCheckoutItem] = useState<any>(null)
  const [checkoutCartItems, setCheckoutCartItems] = useState<any[]>([])
  // settings / security / profileDetails / profileEdit overlays + their state
  // machine (currentProfile, previousScreenFromSecurity, editProfileFromSettings)
  // now live in the Zustand modal store and render via <AccountOverlayHost />.
  // referralNetwork overlay visibility now lives in the Zustand modal store
  // (referralNetworkOpen / openReferralNetwork) and renders via ModalHost. The
  // referralTree below stays here because AffiliateReferralModal also reads it.
  const [referralTree, setReferralTree] = useState<any>(null)
  const [closeReferralNetwork] = useState(false)
  const [referralCodeFromDeepLink, setReferralCodeFromDeepLink] = useState<
    string | null
  >(null)
  const [referrerProfileData, setReferrerProfileData] = useState<any>(null)
  const [, setReferrerProfileLoading] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [previousTab, setPreviousTab] = useState<TabKey>("home")
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  )
  const [previousSearchQuery, setPreviousSearchQuery] = useState<string | null>(
    null
  )
  const [searchSourceProductId, setSearchSourceProductId] = useState<
    number | null
  >(null)
  const [shopSourceProductId, setShopSourceProductId] = useState<number | null>(
    null
  )
  const [productDetailSource, setProductDetailSource] = useState<
    "tab" | "cart" | "shop" | "search"
  >("tab")
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  )
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [, setNotificationTotalCount] = useState(0)
  const [deviceToken] = useState<string | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  // showPurchases / purchasesStatus / purchasesInitialOrderId are declared
  // earlier (above handleNotificationPressed, which uses them).
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [showPaymentCancel, setShowPaymentCancel] = useState(false)
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [paymentConfirmationData, setPaymentConfirmationData] =
    useState<any>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  // History overlay migrated to the Zustand modal store (useModalStore).
  const [linkedAccountsRefreshTrigger, setLinkedAccountsRefreshTrigger] =
    useState(0)
  // Info-page overlays (About Us, Privacy Policy, etc.) migrated to the Zustand
  // modal store (src/store/modalStore.ts) and rendered by <ModalHost />.
  const [paymentSourceScreen, setPaymentSourceScreen] = useState<
    "checkout" | "purchases"
  >("checkout")
  const [showAffiliateReferralModal, setShowAffiliateReferralModal] =
    useState(false)
  const [affiliateLoading, setAffiliateLoading] = useState(false)
  const [showShippingAddressScreen, setShowShippingAddressScreen] =
    useState(false)
  const [shippingAddressScreenData, setShippingAddressScreenData] =
    useState<any>(null)
  const [shopSourceIsCart, setShopSourceIsCart] = useState(false)
  const [shopSourceIsCheckout, setShopSourceIsCheckout] = useState(false)
  const [checkoutSource, setCheckoutSource] = useState<"product" | "cart">(
    "cart"
  )
  // AF Wallet overlays migrated to the Zustand modal store (useModalStore) and
  // rendered by <ModalHost />.
  // Referral signup flow (intro/signup/OTP) state migrated to the Zustand modal
  // store and rendered by <ReferralSignupFlow />.
  // PV Earner overlay visibility now lives in the Zustand modal store
  // (pvEarnerOpen / openPVEarner) and renders via ModalHost.
  const [showShopProductDetail, setShowShopProductDetail] = useState(false)
  const [shopSelectedProductId, setShopSelectedProductId] = useState<
    number | null
  >(null)
  // Whether the open shop product detail is a ZQ (separate-backend) product, so
  // ProductDetailScreen fetches from the right endpoint.
  const [shopSelectedProductIsZq, setShopSelectedProductIsZq] = useState(false)
  // chatbotHidden migrated to src/store/uiStore.ts (consumed only by ChatBotIcon)

  // Enrich user object with badge_image if missing
  const enrichedUser = useMemo(() => {
    if (!user) return null

    const enriched: any = { ...user }

    const badgeImageSource = getBadgeImage(user.rank || (user as any).badge)
    if (badgeImageSource) {
      enriched.badge_image = badgeImageSource
    }

    if (referralCodeFromDeepLink && !enriched.referrer_username) {
      enriched.referrer_username = referralCodeFromDeepLink
    }

    return enriched
  }, [user, referralCodeFromDeepLink])

  // Handle product deep links
  useEffect(() => {
    if (productSlugFromDeepLink) {
      console.log(
        "[AppNavigator] Handling product deep link:",
        productSlugFromDeepLink
      )
      // Parse the product ID from the slug (format: "item-slug-name-with-id" or similar)
      // The ProductDetailScreen will handle fetching the product data from the slug
      // For now, we pass the slug to the ProductDetailScreen
      // The screen will parse it and fetch the product

      // TODO: Implement slug parsing to extract product ID if needed
      // For MVP, we're passing the entire slug to ProductDetailScreen
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to an external deep-link navigation event (productSlugFromDeepLink)
      setSelectedProductId(0) // Temporary: will be handled by ProductDetailScreen

      if (onProductDeepLinkHandled) {
        onProductDeepLinkHandled()
      }
    }
  }, [productSlugFromDeepLink, onProductDeepLinkHandled])

  // Home screen data - persists across navigation
  const [homeCategories, setHomeCategories] = useState<CategoryItem[]>([])
  const [homeBrands, setHomeBrands] = useState<BrandItem[]>([])
  const [homeFeaturedProducts, setHomeFeaturedProducts] = useState<
    ProductCard[]
  >([])
  const [homeRoomTypes, setHomeRoomTypes] = useState<RoomType[]>([])
  const [homeLoadingFeatured, setHomeLoadingFeatured] = useState(false)
  const [isInitialHomeDataReady, setIsInitialHomeDataReady] = useState(false)
  const homeInitialFetchRef = useRef(false)

  // Wishlist data using React Query
  const {
    data: wishlistData = [],
    isLoading: wishlistLoading,
    isFetching: wishlistRefreshing,
    invalidateWishlist,
  } = useWishlist({ token })

  // Optimistic wishlist updates
  const [optimisticWishlistUpdates, setOptimisticWishlistUpdates] = useState<
    Record<number, any>
  >({})
  const wishlistItems = useMemo(() => {
    const itemsMap = new Map(
      wishlistData.map((item) => [item.product_id, item])
    )

    // Apply optimistic updates
    Object.entries(optimisticWishlistUpdates).forEach(([productId, update]) => {
      if (update.isAdded) {
        itemsMap.set(Number(productId), update.item)
      } else {
        itemsMap.delete(Number(productId))
      }
    })

    return Array.from(itemsMap.values())
  }, [wishlistData, optimisticWishlistUpdates])

  // Navigation ref for notification handling
  const navigationRef = useRef<any>(null)


  // Create navigation handler for notifications
  const handleNotificationNavigation = (screen: string, params?: any) => {
    if (screen === "Orders") {
      setShowPurchases(true)
      setPurchasesStatus(params?.status || "pending")
      if (params?.orderId) {
        setPurchasesInitialOrderId(params.orderId)
      }
    } else if (screen === "Wallet") {
      // Navigate to wallet/payment screen if available
      Toast.show({
        type: "info",
        text1: "Payment Received",
        text2: "Check your wallet for details",
      })
    } else if (screen === "Profile") {
      // Navigate to profile referrals
      useModalStore.getState().openReferralNetwork()
    }
  }

  // Set navigation ref to use in notification service
  useEffect(() => {
    navigationRef.current = {
      navigate: handleNotificationNavigation,
    }
  }, [])

  const refreshNotificationCount = useCallback(async () => {
    if (!token) return
    try {
      const data = await orderService.getNotifications(token)
      setNotificationTotalCount(data.total || data.notifications?.length || 0)
    } catch (error) {
      console.error("Error refreshing notification count:", error)
    }
  }, [token])

  // Initialize cache and preload data on mount
  useEffect(() => {
    const init = async () => {
      console.log("🚀 APP NAVIGATOR MOUNTING - INITIALIZING CACHE...")
      await cacheUtils.init()
      // Preload cached home data and dark mode preference immediately
      try {
        console.log("📂 READING CACHE FILES...")
        const [
          cachedCats,
          cachedBrands,
          cachedRooms,
          cachedProducts,
          cachedDarkMode,
        ] = await Promise.all([
          cacheUtils.get<CategoryItem[]>("home_categories"),
          cacheUtils.get<BrandItem[]>("home_brands"),
          cacheUtils.get<RoomType[]>("home_rooms"),
          cacheUtils.get<ProductCard[]>("home_featured_products"),
          cacheUtils.get<boolean>("dark_mode_pref"),
        ])
        console.log("📍 CACHE READ RESULTS:", {
          cachedDarkMode,
          isDarkModeType: typeof cachedDarkMode,
          isNull: cachedDarkMode === null,
          cachedProductsCount: cachedProducts?.length || 0,
        })
        if (cachedCats?.length) setHomeCategories(cachedCats)
        if (cachedBrands?.length) setHomeBrands(cachedBrands)
        if (cachedRooms?.length) setHomeRoomTypes(cachedRooms)
        if (cachedProducts?.length) setHomeFeaturedProducts(cachedProducts)
        if (cachedDarkMode !== null && typeof cachedDarkMode === "boolean") {
          console.log("✅ LOADING DARK MODE FROM CACHE:", cachedDarkMode)
          setIsDarkMode(cachedDarkMode)
        } else {
          console.log(
            "⚠️ NO VALID CACHED DARK MODE FOUND - USING DEFAULT FALSE"
          )
        }
        console.log("✅ PRELOADED CACHE ON APP START")
      } catch (error) {
        console.log("❌ Preload error:", error)
      }
    }
    init()
  }, [])

  // Handle deep linking for payment redirects and notification orders
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log("[AppNavigator] 🔗 Deep link received:", url)
      console.log("[AppNavigator] 🔗 Deep link type:", typeof url)
      console.log(
        "[AppNavigator] 🔗 Deep link includes purchases://:",
        url.includes("purchases://")
      )
      console.log(
        "[AppNavigator] 🔗 Deep link includes apsarahome://purchases/:",
        url.includes("apsarahome://purchases/")
      )

      if (
        url.includes("payment/success") ||
        url.includes("/app/checkout/success") ||
        url.includes("apsarahome://payment/success")
      ) {
        console.log("[AppNavigator] Payment success deep link triggered:", url)
        setShowPaymentWebView(false)

        // Extract checkout_id from URL if present
        const checkoutIdMatch = url.match(/checkout_id=([^&]+)/)
        const checkoutId = checkoutIdMatch?.[1]

        console.log("[AppNavigator] Checkout ID from URL:", checkoutId)

        // Fetch latest order and user info to show in confirmation screen
        if (token) {
          try {
            console.log(
              "[AppNavigator] Fetching latest order and user details for confirmation..."
            )
            const headers = { Authorization: `Bearer ${token}` }

            console.log(
              "[AppNavigator] 🔄 Fetching order history from backend..."
            )
            const [orderRes, userRes] = await Promise.all([
              axios.get(`${API_CONFIG.BASE_URL}/orders/history`, { headers }),
              axios.get(`${API_CONFIG.BASE_URL}/auth/me`, { headers }),
            ])

            const orders = orderRes.data?.orders || []
            const userData = userRes.data?.data || userRes.data || {}

            console.log("[AppNavigator] 📦 Orders received:", {
              count: orders.length,
              firstOrder: orders[0],
            })

            if (orders.length > 0) {
              const latestOrder = orders[0] // Most recent order first
              console.log("[AppNavigator] ✅ Latest order details:", {
                orderId: latestOrder.id,
                orderNumber: latestOrder.order_number,
                status: latestOrder.status,
                paymentStatus: latestOrder.payment_status,
                fulfillmentStatus: latestOrder.fulfillment_status,
                amount: latestOrder.total_amount,
                paymentMethod: latestOrder.payment_method,
                fullOrder: JSON.stringify(latestOrder, null, 2),
              })
              console.log("[AppNavigator] 👤 User data fetched:", {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
              })

              // Prepare confirmation data with user info from auth/me
              const confirmationData = {
                order_number: latestOrder.order_number,
                transaction_id: latestOrder.transaction_id || latestOrder.id,
                amount: latestOrder.total_amount,
                payment_method: latestOrder.payment_method,
                product_name: latestOrder.items?.[0]?.name || "Order",
                quantity:
                  latestOrder.items?.reduce(
                    (sum: number, item: any) => sum + item.quantity,
                    0
                  ) || 1,
                customer_name:
                  userData.name ||
                  userData.full_name ||
                  latestOrder.customer_name ||
                  "Customer",
                customer_email: userData.email || latestOrder.customer_email,
                customer_phone:
                  userData.phone ||
                  userData.mobile ||
                  latestOrder.customer_phone,
                delivery_address: latestOrder.delivery_address,
                shipping_fee: latestOrder.shipping_fee || 0,
                created_at: latestOrder.created_at,
              }

              setPaymentConfirmationData(confirmationData)
              setShowPaymentConfirmation(true)
            } else {
              console.log("[AppNavigator] No orders found")
              Toast.show({
                type: "info",
                text1: "Order Confirmed",
                text2: "Payment successful",
              })
              setShowPaymentSuccess(true)
            }
          } catch (error: any) {
            console.error(
              "[AppNavigator] Error fetching order or user data:",
              error
            )
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to load order details",
            })
            setShowPaymentSuccess(true)
          }
        }
      } else if (
        url.includes("payment/cancel") ||
        url.includes("/app/checkout/cancel") ||
        url.includes("apsarahome://payment/cancel")
      ) {
        console.log("[AppNavigator] Payment cancel deep link triggered:", url)
        setShowPaymentCancel(true)
        setShowPaymentWebView(false)
      } else if (
        url.includes("purchases://") ||
        url.includes("apsarahome://purchases/")
      ) {
        console.log(
          "[AppNavigator] Order notification deep link triggered:",
          url
        )
        // Parse purchases deeplinks:
        // - purchases://status/checkout_id
        // - apsarahome://purchases/status/checkout_id
        const normalized = url.includes("apsarahome://purchases/")
          ? url.replace("apsarahome://purchases/", "")
          : url.replace("purchases://", "")
        console.log("[AppNavigator] Normalized deeplink:", normalized)
        const parts = normalized.split("/")
        const status = parts[0]
        const checkoutId = parts[1]
        console.log("[AppNavigator] Parsed deeplink parts:", {
          status,
          checkoutId,
          totalParts: parts.length,
        })

        if (checkoutId) {
          console.log("[AppNavigator] Opening purchases screen with order:", {
            status,
            checkoutId,
          })
          // Show the PurchasesScreen modal with the specific order
          setPurchasesStatus(normalizePurchaseStatus(status))
          setPurchasesInitialOrderId(checkoutId)
          setShowPurchases(true)
        } else {
          console.log("[AppNavigator] ⚠️ No checkout ID found in deeplink:", {
            normalized,
            parts,
          })
        }
      } else if (
        url.includes("/products/") ||
        url.includes("/product/") ||
        url.includes("apsarahome://product") ||
        url.includes("apsarahome://products")
      ) {
        // Parse product link - Formats:
        // - https://afhome.ph/product/nxt-echo-i2834 (slug)
        // - https://www.afhome.ph/product/nxt-echo-i2834 (slug)
        // - apsarahome://product/nxt-echo-i2834 (slug)
        let productSlugOrId: string = ""

        if (url.includes("apsarahome://")) {
          // Extract from app scheme: apsarahome://product/nxt-echo-i2834
          productSlugOrId = url.split("/").pop()?.split("?")[0] || ""
        } else {
          // Extract from web URL: https://afhome.ph/product/nxt-echo-i2834
          const pathMatch = url.match(/\/products?\/([^/?]+)/)
          productSlugOrId = pathMatch?.[1] || ""
        }

        if (productSlugOrId) {
          // Extract product ID from slug format: {name-slug}-i{id}
          const idMatch = productSlugOrId.match(/-i(\d+)$/)
          const productId = idMatch ? parseInt(idMatch[1], 10) : null

          if (productId) {
            // Set the selected product ID - the detail screen will fetch the product
            setSelectedProductId(productId)
            Toast.show({
              type: "info",
              text1: "Opening Product",
              text2: "Loading product details...",
            })
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Invalid product link format",
            })
          }
        }
      } else if (url.includes("/ref/") || url.includes("apsarahome://ref/")) {
        console.log("[AppNavigator] Referral deep link triggered:", url)
        // Parse referral link - Format: https://www.afhome.ph/ref/username or apsarahome://ref/username
        const username = url.includes("apsarahome://ref/")
          ? url.split("apsarahome://ref/")[1]?.split("?")[0] || ""
          : url.split("/ref/")[1]?.split("?")[0] || ""
        if (username) {
          console.log(
            "[AppNavigator] Opening referral screen with username:",
            username
          )
          setReferralCodeFromDeepLink(decodeURIComponent(username))
          openReferralIntro()
        }
      } else if (url.includes("/shop")) {
        console.log("[AppNavigator] Shop deep link triggered:", url)
        // Parse shop link - Format: https://www.afhome.ph/shop?ref=username
        const refParam = new URL(url).searchParams.get("ref")
        if (refParam) {
          console.log("[AppNavigator] Opening shop with referral:", refParam)
          setReferralCodeFromDeepLink(refParam)
          Toast.show({
            type: "info",
            text1: "Shopping Link",
            text2: `Referred by ${refParam}`,
          })
        }
        // Navigate to shop tab
        setActiveTab("shop")
      }
    }

    const subscription = Linking.addEventListener("url", handleDeepLink)

    // Check if app was launched from deep link
    Linking.getInitialURL()
      .then((url) => {
        if (url != null) {
          console.log("[AppNavigator] Initial deep link:", url)
          handleDeepLink({ url })
        } else {
          console.log("[AppNavigator] ℹ️ No initial deep link found")
        }
      })
      .catch((err) => {
        console.log("[AppNavigator] ⚠️ Error getting initial URL:", err)
      })

    return () => {
      subscription.remove()
    }
  }, [token, openReferralIntro])

  // Save dark mode preference to cache whenever it changes
  useEffect(() => {
    const saveDarkMode = async () => {
      console.log("💾 ATTEMPTING TO SAVE DARK MODE:", isDarkMode)
      try {
        await cacheUtils.init()
        await cacheUtils.set("dark_mode_pref", isDarkMode)
        console.log("✅ DARK MODE SAVED SUCCESSFULLY:", isDarkMode)
      } catch (error) {
        console.log("❌ Error saving dark mode:", error)
      }
    }
    saveDarkMode()
  }, [isDarkMode])

  // Double-check dark mode from cache periodically (helps with hot reload issues).
  // This only matters during development hot reloads, so skip the 2s poll entirely
  // in production builds — saving constant AsyncStorage reads / JS wakeups.
  useEffect(() => {
    if (!__DEV__) return

    const checkDarkModeCache = async () => {
      try {
        await cacheUtils.init()
        const cachedDarkMode = await cacheUtils.get<boolean>("dark_mode_pref")
        if (
          cachedDarkMode !== null &&
          typeof cachedDarkMode === "boolean" &&
          cachedDarkMode !== isDarkMode
        ) {
          console.log(
            "🔄 SYNCING DARK MODE FROM CACHE (hot reload detected):",
            cachedDarkMode
          )
          setIsDarkMode(cachedDarkMode)
        }
      } catch (error) {
        console.log("❌ Error checking dark mode cache:", error)
      }
    }

    // Check on mount and every 2 seconds to catch hot reloads
    checkDarkModeCache()
    const interval = setInterval(checkDarkModeCache, 2000)
    return () => clearInterval(interval)
  }, [isDarkMode])

  const fetchHomeData = useCallback(async (forceRefresh = false) => {
    if (!token) return

    try {
      const totalStart = performance.now()

      console.log("═══════════════════════════════════════════════════════════")
      console.log("🔄 [APP-NAVIGATOR] FETCH HOME DATA CALLED")
      console.log("═══════════════════════════════════════════════════════════")

      // CHECK CACHE FIRST - skip fetch if recent cache exists
      if (!forceRefresh && homeCategories.length > 0 && homeBrands.length > 0) {
        console.log("✅ [APP-NAVIGATOR] CACHE HIT - Using cached data")
        console.log(
          "   Cached: Categories=%d, Brands=%d, Rooms=%d, Products=%d",
          homeCategories.length,
          homeBrands.length,
          homeRoomTypes.length,
          homeFeaturedProducts.length
        )

        console.log(
          "═══════════════════════════════════════════════════════════"
        )
        setIsInitialHomeDataReady(true)
        return
      }

      console.log(
        "❌ [APP-NAVIGATOR] CACHE MISS - Fetching fresh data from API"
      )

      setHomeLoadingFeatured(true)

      // STEP 1: Fetch only categories first (fast, ~200ms)
      console.log("⏱️  STEP 1: Fetching categories...")
      const categoryStart = performance.now()
      const categoryData = await productService.getShopByCategories(token)
      const sortedCategories = categoryData.sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
      )
      const categoryTime = performance.now() - categoryStart
      console.log(
        `✅ Categories fetched: ${Math.round(categoryTime)}ms (${sortedCategories.length} items)`
      )

      // Update state immediately with categories
      setHomeCategories(sortedCategories)
      await cacheUtils.set("home_categories", sortedCategories)

      // Ready to show home screen with at least categories
      const readyTime = performance.now() - totalStart
      console.log(
        `🎉 HOME SCREEN READY FOR DISPLAY: ${Math.round(readyTime)}ms`
      )
      setIsInitialHomeDataReady(true)

      // STEP 2: Lazy load brands, rooms, and featured products in background
      console.log("⏱️  STEP 2: Lazy loading brands, rooms, products...")
      const lazyStart = performance.now()
      const [brandData, roomData, productData, zqBrandNames] =
        await Promise.all([
          productService.getShopByBrands(token),
          productService.getShopByRooms(token),
          productService.getProductCards(token).catch(() => []),
          productService.getZqBrandNames(token),
        ])

      const lazyTime = performance.now() - lazyStart
      console.log(`✅ Lazy load complete: ${Math.round(lazyTime)}ms`)

      // Keep brands that have products in the regular DB OR in external (ZQ) sources
      const visibleBrands = (brandData || [])
        .filter(
          (b: any) =>
            (b.total_products ?? 0) > 0 ||
            zqBrandNames.has((b.name ?? "").trim().toLowerCase())
        )
        .map((b: any) => ({
          ...b,
          isZqBrand: zqBrandNames.has((b.name ?? "").trim().toLowerCase()),
        }))
      console.log(
        `🏷️  Brands: ${(brandData || []).length} total → ${visibleBrands.length} with products`
      )

      // Filter for affordahome brand products
      const affordahomeProducts = Array.isArray(productData)
        ? productData.filter(
            (p) => p.brandName?.toLowerCase() === "affordahome"
          )
        : []

      console.log("🏠 AFFORDAHOME PRODUCTS:", affordahomeProducts.length)

      // Update state with lazy-loaded data
      setHomeBrands(visibleBrands)
      setHomeRoomTypes(roomData || [])
      setHomeFeaturedProducts(affordahomeProducts.slice(0, 10))

      // Update cache
      await Promise.all([
        cacheUtils.set("home_brands", brandData || []),
        cacheUtils.set("home_rooms", roomData || []),
        cacheUtils.set(
          "home_featured_products",
          affordahomeProducts.slice(0, 10)
        ),
      ])

      const totalTime = performance.now() - totalStart
      console.log("═══════════════════════════════════════════════════════════")
      console.log("✅ [APP-NAVIGATOR] COMPLETE LOAD SUMMARY")
      console.log("═══════════════════════════════════════════════════════════")
      console.log("Step 1 (Categories):        %dms", Math.round(categoryTime))
      console.log("Display Ready:              %dms", Math.round(readyTime))
      console.log("Step 2 (Lazy Load):         %dms", Math.round(lazyTime))
      console.log("Total:                      %dms", Math.round(totalTime))
      console.log("Data Loaded:", {
        categories: sortedCategories.length,
        brands: (brandData || []).length,
        rooms: (roomData || []).length,
        products: affordahomeProducts.length,
      })
      console.log("═══════════════════════════════════════════════════════════")
    } catch (error: any) {
      console.error("❌ Home data fetch error:", error?.message)
      setIsInitialHomeDataReady(true)
    } finally {
      setHomeLoadingFeatured(false)
    }
  }, [
    token,
    homeCategories.length,
    homeBrands.length,
    homeRoomTypes.length,
    homeFeaturedProducts.length,
  ])

  // Fetch cart count, notification count, and home data once the auth token is
  // available. Declared after fetchHomeData so it can call it directly. This is a
  // legitimate on-token data-fetch effect (pre-React-Query migration); the home
  // fetch runs a single time, guarded by homeInitialFetchRef.
  useEffect(() => {
    if (!token) return

    // Fetch cart count
    const headers = { Authorization: `Bearer ${token}` }
    axios
      .get(`${API_CONFIG.BASE_URL}/cart`, { headers })
      .then((cartRes) => setCartCount(extractCount(cartRes.data)))
      .catch(() => {})

    // Initial notification fetch only — real-time updates come from push notifications
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on token change; to be migrated to React Query
    refreshNotificationCount()

    // Fetch home screen data ONCE when token becomes available
    if (!homeInitialFetchRef.current) {
      homeInitialFetchRef.current = true
      fetchHomeData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs intentionally on token change only; home fetch is guarded by homeInitialFetchRef
  }, [token, refreshNotificationCount])

  const refreshHomeData = useCallback(async () => {
    await fetchHomeData(true)
  }, [fetchHomeData])
  console.log(homeBrands)

  const handleOpenAffiliateReferralModal = useCallback(async () => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Missing authentication token",
      })
      return
    }

    // Show modal immediately, fetch data in background
    setShowAffiliateReferralModal(true)

    if (!referralTree) {
      try {
        setAffiliateLoading(true)
        const data = await referralService.getReferralTree(token)
        setReferralTree(data)
      } catch (error: any) {
        console.error("Error fetching referral tree:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message || "Failed to load affiliate referral screen",
        })
      } finally {
        setAffiliateLoading(false)
      }
    }
  }, [token, referralTree])

  // Optimistic wishlist toggle handler
  const handleOptimisticWishlistToggle = useCallback(
    (productId: number, isWishlisted: boolean, productData?: any) => {
      if (isWishlisted) {
        // Adding to wishlist - construct proper WishlistItem structure
        const newItem = {
          wishlist_id: Date.now(), // Temporary ID
          product_id: productId,
          date_added: new Date().toISOString(),
          product: {
            id: productData?.id || productId,
            name: productData?.name || "",
            brand: productData?.brandName || productData?.brand || "",
            image: productData?.image || "",
            priceSrp: productData?.originalPrice || productData?.priceSrp || 0,
            priceMember:
              productData?.memberPrice || productData?.priceMember || 0,
            avgRating: productData?.avgRating || 0,
            qty: productData?.qty || 1,
            prodpv: productData?.pv || productData?.prodpv || 0,
          },
        }
        setOptimisticWishlistUpdates((prev) => ({
          ...prev,
          [productId]: { isAdded: true, item: newItem },
        }))
      } else {
        // Removing from wishlist
        setOptimisticWishlistUpdates((prev) => ({
          ...prev,
          [productId]: { isAdded: false },
        }))
      }
      // Refetch in background to sync with server
      invalidateWishlist()
    },
    [invalidateWishlist]
  )

  useEffect(() => {
    if (!searchVisible) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSearchVisible(false)
      // If search was opened from ProductDetailScreen, restore it
      if (searchSourceProductId !== null) {
        setSelectedProductId(searchSourceProductId)
        setSearchSourceProductId(null)
      } else {
        // Otherwise restore the previous tab
        setActiveTab(previousTab)
      }
      return true
    })
    return () => sub.remove()
  }, [searchVisible, previousTab, searchSourceProductId])

  useEffect(() => {
    if (selectedProductId === null) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedProductId(null)
      if (productDetailSource === "cart") {
        setShowCart(true)
        return true
      }
      // If product was opened from search, restore search query
      if (previousSearchQuery) {
        setSearchQuery(previousSearchQuery)
        setPreviousSearchQuery(null)
      } else {
        // Otherwise restore the previous tab
        setActiveTab(previousTab)
      }
      return true
    })
    return () => sub.remove()
  }, [selectedProductId, previousTab, previousSearchQuery, productDetailSource])

  useEffect(() => {
    if (!showShopProductDetail) return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowShopProductDetail(false)
      setShopSelectedProductId(null)
      return true
    })
    return () => sub.remove()
  }, [showShopProductDetail])

  // Global back button handler for exit confirmation on main screens
  useEffect(() => {
    if (
      selectedProductId !== null ||
      searchVisible ||
      searchQuery ||
      showShopProductDetail
    )
      return
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowExitConfirm(true)
      return true
    })
    return () => sub.remove()
  }, [selectedProductId, searchVisible, searchQuery, showShopProductDetail])

  // Update notification count when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        console.log(
          "???? App came to foreground, refreshing notification count"
        )
        refreshNotificationCount()
      }
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    )
    return () => subscription.remove()
  }, [token, refreshNotificationCount])

  // Fetch referrer's public profile when referral code from deep link is set
  useEffect(() => {
    if (!referralCodeFromDeepLink || referrerProfileData) return

    const fetchReferrerProfile = async () => {
      try {
        setReferrerProfileLoading(true)
        const profile = await referralService.getPublicProfile(
          referralCodeFromDeepLink
        )
        setReferrerProfileData(profile)
      } catch (error: any) {
        console.error("Error fetching referrer profile:", error)
        // Silently fail - the screen will still show with username only
      } finally {
        setReferrerProfileLoading(false)
      }
    }

    fetchReferrerProfile()
    // Safe to depend on referrerProfileData: the early-return guard above stops
    // a re-fetch once it's set, so this can't loop.
  }, [referralCodeFromDeepLink, referrerProfileData])


  // Navigation context value for notifications to use. Memoized so it doesn't
  // recreate every render (its callback only uses stable setters + a module-level
  // helper), preventing needless re-renders of NavigationProvider consumers.
  const navigationValue: NavigationContextType = useMemo(
    () => ({
      openPurchaseOrder: (checkoutId: string, status?: string) => {
        console.log("[AppNavigator] openPurchaseOrder called:", {
          checkoutId,
          status,
        })
        setPurchasesStatus(normalizePurchaseStatus(status))
        setPurchasesInitialOrderId(checkoutId)
        setShowPurchases(true)
      },
    }),
    []
  )

  // Memoized AppContext value. Recreated only when one of the values it actually
  // exposes changes — so unrelated state churn (modal booleans like showCart,
  // showCheckout, etc., which are NOT in this object) no longer re-renders every
  // useAppContext consumer. The dep array is verified by react-hooks/exhaustive-deps.
  // Profile update request — moved out of the inline ProfileEdit onSave when that
  // screen migrated to AccountOverlayHost. Returns true on success so the host can
  // run the same post-save back-navigation; toasts stay here with the data logic.
  const handleProfileSave = useCallback(
    async (profileData: any): Promise<boolean> => {
      try {
        const updatePayload = {
          name: profileData.firstName || "",
          last_name: profileData.lastName || "",
          phone: profileData.phone,
          middle_name: profileData.middleName,
          birth_date: profileData.birthDate,
          gender: profileData.gender?.toLowerCase() || "male",
          occupation: profileData.occupation,
          work_location:
            profileData.workLocation?.toLowerCase() === "overseas"
              ? "overseas"
              : "local",
          country: profileData.country,
          address: profileData.streetAddress,
          region: profileData.region,
          province: profileData.province,
          city: profileData.city,
          barangay: profileData.barangay,
          zip_code: profileData.zipCode,
        }
        await axios.put(`${API_CONFIG.BASE_URL}/auth/me`, updatePayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Profile updated successfully",
        })
        return true
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2:
            error.response?.data?.message ||
            error.message ||
            "Failed to update profile",
        })
        return false
      }
    },
    [token]
  )

  const appContextValue = useMemo(
    () => ({
      token: token || "",
      enrichedUser,
      isDarkMode,
      setIsDarkMode,
      cartCount,
      wishlistItems,
      wishlistLoading,
      wishlistRefreshing,
      invalidateWishlist,
      onWishlistChange: () => invalidateWishlist(),
      handleOptimisticWishlistToggle,
      homeCategories,
      setHomeCategories,
      homeBrands,
      setHomeBrands,
      homeRoomTypes,
      setHomeRoomTypes,
      homeFeaturedProducts,
      setHomeFeaturedProducts,
      homeLoadingFeatured,
      setHomeLoadingFeatured,
      isInitialHomeDataReady,
      homeInitialFetchRef,
      refreshHomeData,
      activeTab,
      setActiveTab,
      previousTab,
      setPreviousTab,
      selectedRoomId,
      setSelectedRoomId,
      selectedCategoryId,
      setSelectedCategoryId,
      selectedBrandId,
      setSelectedBrandId,
      selectedBrand,
      setSelectedBrand,
      shopSourceIsCart,
      setShopSourceIsCart,
      shopSourceIsCheckout,
      setShopSourceIsCheckout,
      shopSourceProductId,
      setShopSourceProductId,
      searchQuery: null,
      setSearchQuery: () => {},
      searchVisible: false,
      setSearchVisible: () => {},
      selectedProductId: null,
      setSelectedProductId,
      previousSearchQuery: null,
      setPreviousSearchQuery,
      searchSourceProductId: null,
      setSearchSourceProductId,
      showLeaderboard,
      setShowLeaderboard,
      profileDetailsFromTab: false,
      setProfileDetailsFromTab: () => {},
      closeReferralNetwork,
      setCloseReferralNetwork: () => {},
      referralTree,
      setReferralTree,
      purchasesStatus: purchasesStatus,
      setPurchasesStatus,
      purchasesInitialOrderId: purchasesInitialOrderId,
      setPurchasesInitialOrderId,
      setShowPurchases,
      linkedAccountsRefreshTrigger,
      setLinkedAccountsRefreshTrigger: () => {},
      showShopProductDetail,
      setShowShopProductDetail,
      shopSelectedProductId,
      setShopSelectedProductId,
      shopSelectedProductIsZq,
      setShopSelectedProductIsZq,
      onProductPress: (id: number) => {
        setPreviousSearchQuery(null)
        setPreviousTab(activeTab)
        setSelectedProductId(id)
      },
      onCartPress: () => setShowCart(true),
      onSearchPress: () => {
        setSearchSourceProductId(null)
        setPreviousTab(activeTab)
        setSearchVisible(true)
      },
      onShopByRoomPress: (roomId: number) => {
        setPreviousTab(activeTab)
        setSelectedRoomId(roomId)
        setSelectedCategoryId(null)
        setActiveTab("shop")
      },
      onShopByCategoryPress: (categoryId: number) => {
        setPreviousTab(activeTab)
        setSelectedCategoryId(categoryId)
        setSelectedRoomId(null)
        setActiveTab("shop")
      },
      onShopByBrandPress: (brandId: number) => {
        const brand = homeBrands.find((b) => b.id === brandId)
        setPreviousTab(activeTab)
        setSelectedBrandId(brandId)
        setSelectedBrand(brand || null)
        setSelectedRoomId(null)
        setSelectedCategoryId(null)
        setActiveTab("shop")
      },
      onShopNavigate: () => {
        setPreviousTab("profile")
        setActiveTab("shop")
      },
      onNavigateWishlist: () => {
        setPreviousTab("profile")
        setActiveTab("wishlist")
      },
      onShowReferralNetwork: (tree: ReferralTree | null) => {
        if (tree) setReferralTree(tree)
        useModalStore.getState().openReferralNetwork()
      },
      onPurchaseItemClick: (status: string) => {
        setPurchasesStatus(normalizePurchaseStatus(status))
        setShowPurchases(true)
      },
      onShowAFWalletOverview: () => openWalletPage("overview"),
      onShowAFWalletVoucher: () => openWalletPage("voucher"),
      onShowAFWalletRewards: () => openWalletPage("rewards"),
      onShowAFWalletNetwork: () => openWalletPage("network"),
      handleOpenAffiliateReferralModal,
      onLogout,
    }),
    [
      token,
      enrichedUser,
      isDarkMode,
      cartCount,
      wishlistItems,
      wishlistLoading,
      wishlistRefreshing,
      invalidateWishlist,
      handleOptimisticWishlistToggle,
      homeCategories,
      homeBrands,
      homeRoomTypes,
      homeFeaturedProducts,
      homeLoadingFeatured,
      isInitialHomeDataReady,
      refreshHomeData,
      activeTab,
      previousTab,
      selectedRoomId,
      selectedCategoryId,
      selectedBrandId,
      selectedBrand,
      shopSourceIsCart,
      shopSourceIsCheckout,
      shopSourceProductId,
      showLeaderboard,
      closeReferralNetwork,
      referralTree,
      purchasesStatus,
      purchasesInitialOrderId,
      linkedAccountsRefreshTrigger,
      showShopProductDetail,
      shopSelectedProductId,
      shopSelectedProductIsZq,
      handleOpenAffiliateReferralModal,
      onLogout,
      openWalletPage,
    ]
  )

  return (
    <NavigationProvider value={navigationValue}>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={["left", "right"]}>
          <View style={styles.body}>
            {/* Overlay: Search Results Screen - always mounted to preserve state and prevent refetch */}
            {searchQuery && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: selectedProductId !== null ? -1 : 1,
                  pointerEvents: selectedProductId !== null ? "none" : "auto",
                }}
              >
                <SearchResultScreen
                  token={token}
                  query={searchQuery}
                  isDarkMode={isDarkMode}
                  onBack={() => {
                    setSearchVisible(true)
                  }}
                  onProductPress={(product) => {
                    setPreviousSearchQuery(searchQuery)
                    setProductDetailSource("search")
                    setSelectedProductId(product.id)
                  }}
                />
              </View>
            )}

            {/* Overlay: Product Detail Screen - rendered last so it appears on top */}
            {selectedProductId !== null && (
              <ProductDetailScreen
                productId={selectedProductId}
                token={token}
                user={enrichedUser}
                cartCount={cartCount}
                wishlistItems={wishlistItems}
                onBack={() => {
                  setSelectedProductId(null)
                  if (productDetailSource === "cart") {
                    setShowCart(true)
                  } else if (productDetailSource === "search") {
                    // Stay on search results screen - it's already visible
                  }
                }}
                onProductPress={(id) => {
                  setPreviousSearchQuery(null)
                  setProductDetailSource("tab")
                  setSelectedProductId(id)
                }}
                onSearch={() => {
                  setSearchSourceProductId(selectedProductId)
                  setSelectedProductId(null)
                  setPreviousTab(activeTab)
                  setSearchVisible(true)
                }}
                onCartUpdate={async () => {
                  const headers = { Authorization: `Bearer ${token}` }
                  try {
                    const cartRes = await axios.get(
                      `${API_CONFIG.BASE_URL}/cart`,
                      { headers }
                    )
                    setCartCount(extractCount(cartRes.data))
                  } catch (error) {
                    console.error("Failed to update cart count:", error)
                  }
                }}
                onNavigateToCart={() => {
                  setShowCart(true)
                }}
                onWishlistToggle={(productId, isWishlisted) => {
                  invalidateWishlist()
                }}
                onShopNavigate={(brandType, shopName) => {
                  setShopSourceProductId(selectedProductId)
                  setSelectedProductId(null)
                  setSelectedBrandId(brandType)
                  setSelectedBrand({
                    id: brandType,
                    name: shopName,
                  })
                  setPreviousTab(activeTab)
                  setActiveTab("shop")
                }}
                onCheckout={(product, quantity, variant) => {
                  const item = {
                    product_id: product.id,
                    product_name: product.name,
                    product_image: product.image || product.images?.[0],
                    product_price_member:
                      variant?.priceMember || product.priceMember || 0,
                    product_price_srp:
                      variant?.priceSrp || product.priceSrp || 0,
                    brand_name: product.brand,
                    brand_id: product.supplier_id || 0,
                    quantity: quantity,
                    variant_color: variant?.color,
                    variant_size: variant?.name,
                    variant_image: variant?.images?.[0],
                  }
                  setCheckoutItem(item)
                  setCheckoutCartItems([])
                  setPreviousTab(activeTab)
                  setSelectedProductId(null)
                  setCheckoutSource("product")
                  setShowCheckout(true)
                }}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Tab Screens using React Navigation */}
            {!selectedProductId && !searchQuery && (
              <AppContextProvider value={appContextValue}>
                <TabNavigator
                  hideTabBar={
                    !isInitialHomeDataReady ||
                    selectedProductId !== null ||
                    searchQuery !== null ||
                    showLeaderboard ||
                    selectedBrandId !== null
                  }
                />
              </AppContextProvider>
            )}
          </View>

          <Modal
            visible={showTokenModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTokenModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowTokenModal(false)}
            >
              <View style={styles.tokenModal}>
                <Text style={styles.tokenTitle}>Push Notification Token</Text>
                <Text style={styles.tokenSubtitle}>
                  Long-press notification icon to copy
                </Text>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenText} selectable>
                    {deviceToken}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.tokenCopyBtn}
                  onPress={() => {
                    if (deviceToken) {
                      Clipboard.setString(deviceToken)
                      setShowTokenModal(false)
                    }
                  }}
                >
                  <Ionicons name="copy" size={18} color={Colors.white} />
                  <Text style={styles.tokenCopyText}>Copy Token</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tokenCloseBtn}
                  onPress={() => setShowTokenModal(false)}
                >
                  <Text style={styles.tokenCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>

        {searchVisible && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: selectedProductId !== null ? -1 : 10,
              pointerEvents: selectedProductId !== null ? "none" : "auto",
            }}
          >
            <SearchScreen
              token={token}
              isDarkMode={isDarkMode}
              onBack={() => {
                // Back from the search screen always returns to the underlying
                // tab (home). Clear any previous search results so they don't
                // get revealed underneath.
                setSearchVisible(false)
                setSearchQuery(null)
                setActiveTab(previousTab)
              }}
              onProductPress={(productId) => {
                setProductDetailSource("search")
                setSelectedProductId(productId)
              }}
              onSearchSubmit={(query) => {
                setSearchQuery(query)
                setSearchVisible(false)
              }}
            />
          </View>
        )}

        {showShopProductDetail && shopSelectedProductId !== null && (
          <View style={styles.cartScreenOverlay}>
            <ProductDetailScreen
              productId={shopSelectedProductId}
              isZq={shopSelectedProductIsZq}
              token={token}
              user={enrichedUser}
              cartCount={cartCount}
              wishlistItems={wishlistItems}
              onBack={() => {
                setShowShopProductDetail(false)
                setShopSelectedProductId(null)
                setShopSelectedProductIsZq(false)
              }}
              onProductPress={(id) => {
                // Related/you-may-also-like products come from the regular API.
                setShopSelectedProductId(id)
                setShopSelectedProductIsZq(false)
              }}
              onSearch={() => {
                setShowShopProductDetail(false)
                setShopSelectedProductId(null)
                setSearchSourceProductId(null)
                setPreviousTab(activeTab)
                setSearchVisible(true)
              }}
              onCartUpdate={async () => {
                const headers = { Authorization: `Bearer ${token}` }
                try {
                  const cartRes = await axios.get(
                    `${API_CONFIG.BASE_URL}/cart`,
                    { headers }
                  )
                  setCartCount(extractCount(cartRes.data))
                } catch (error) {
                  console.error("Failed to update cart count:", error)
                }
              }}
              onNavigateToCart={() => {
                setShowCart(true)
              }}
              onWishlistToggle={(productId, isWishlisted) => {
                invalidateWishlist()
              }}
              onShopNavigate={(brandType, shopName) => {
                setShowShopProductDetail(false)
                setShopSelectedProductId(null)
                setSelectedBrandId(brandType)
                setSelectedBrand({
                  id: brandType,
                  name: shopName,
                })
                setPreviousTab("shop")
              }}
              onCheckout={(product, quantity, variant) => {
                const item = {
                  product_id: product.id,
                  product_name: product.name,
                  product_image: product.image || product.images?.[0],
                  product_price_member:
                    variant?.priceMember || product.priceMember || 0,
                  product_price_srp: variant?.priceSrp || product.priceSrp || 0,
                  brand_name: product.brand,
                  brand_id: product.supplier_id || 0,
                  quantity: quantity,
                  variant_color: variant?.color,
                  variant_size: variant?.name,
                  variant_image: variant?.images?.[0],
                }
                setCheckoutItem(item)
                setCheckoutCartItems([])
                setShowShopProductDetail(false)
                setShopSelectedProductId(null)
                setCheckoutSource("product")
                setShowCheckout(true)
              }}
              isDarkMode={isDarkMode}
            />
          </View>
        )}

        {showCart && (
          <View style={styles.cartScreenOverlay}>
            <CartScreen
              token={token}
              user={enrichedUser}
              wishlistCount={wishlistItems.length}
              isDarkMode={isDarkMode}
              brands={homeBrands}
              refreshTrigger={cartRefreshTrigger}
              onBack={() => setShowCart(false)}
              onProfilePress={() => {
                setShowCart(false)
                setActiveTab("profile")
              }}
              onProductPress={(productId) => {
                setShowCart(false)
                setPreviousSearchQuery(null)
                setPreviousTab(activeTab)
                setProductDetailSource("cart")
                setSelectedProductId(productId)
              }}
              onShopNavigate={(brandId, shopName) => {
                console.log("[AppNavigator] CartScreen onShopNavigate:", {
                  brandId,
                  shopName,
                  foundInHomeBrands: !!homeBrands.find((b) => b.id === brandId),
                })
                setShowCart(false)
                setShopSourceIsCart(true)
                const brand = homeBrands.find((b) => b.id === brandId) || {
                  id: brandId,
                  name: shopName,
                }
                setPreviousTab(activeTab)
                setSelectedBrandId(brandId)
                setSelectedBrand(brand)
                setSelectedRoomId(null)
                setSelectedCategoryId(null)
                setActiveTab("shop")
              }}
              onCheckout={(selectedItems) => {
                if (selectedItems && selectedItems.length > 0) {
                  // Map cart items to checkout format with correct quantity field
                  const formattedItems = selectedItems.map((item) => ({
                    ...item,
                    quantity: item.crt_quantity || item.quantity || 1,
                  }))
                  setCheckoutCartItems(formattedItems)
                }
                setShowCart(false)
                setCheckoutSource("cart")
                setShowCheckout(true)
              }}
              onWishlistPress={() => {
                setShowCart(false)
                setActiveTab("wishlist")
              }}
            />
          </View>
        )}

        {showCheckout && (
          <View style={styles.cartScreenOverlay}>
            <CheckoutScreen
              item={checkoutCartItems.length === 0 ? checkoutItem : undefined}
              items={checkoutCartItems.length > 0 ? checkoutCartItems : []}
              token={token}
              user={enrichedUser}
              isDarkMode={isDarkMode}
              brands={homeBrands}
              onBack={() => {
                setShowCheckout(false)
                if (checkoutSource === "product") {
                  // If came from product detail, restore it
                  if (checkoutItem) {
                    setSelectedProductId(checkoutItem.product_id)
                  }
                } else {
                  // If came from cart, go back to cart
                  setShowCart(true)
                }
              }}
              onShopNavigate={(brandId, shopName) => {
                setShowCheckout(false)
                setShopSourceIsCheckout(true)
                const brand = homeBrands.find((b) => b.id === brandId) || {
                  id: brandId,
                  name: shopName,
                }
                setPreviousTab(activeTab)
                setSelectedBrandId(brandId)
                setSelectedBrand(brand)
                setSelectedRoomId(null)
                setSelectedCategoryId(null)
                setActiveTab("shop")
              }}
              onNavigateToOrderSuccess={(orderData) => {
                console.log("[AppNavigator] onNavigateToOrderSuccess called")
                setCheckoutOrderData(orderData)
                setShowCheckout(false)
                setShowOrderSuccess(true)
                // Clear checkout items to prevent stale data
                setCheckoutItem(null)
                setCheckoutCartItems([])
              }}
              onNavigateToShippingAddress={(
                addresses,
                selectedAddress,
                onSelect
              ) => {
                setShippingAddressScreenData({
                  addresses,
                  selectedAddress,
                  onSelect,
                })
                setShowShippingAddressScreen(true)
              }}
            />
          </View>
        )}

        {showOrderSuccess && checkoutOrderData && (
          <View style={styles.cartScreenOverlay}>
            <OrderSuccessScreen
              orderData={checkoutOrderData}
              isDarkMode={isDarkMode}
              onBack={() => {
                setShowOrderSuccess(false)
                setShowCheckout(false)
                setShowCart(true)
                setCheckoutOrderData(null)
                setCheckoutItem(null)
                setCheckoutCartItems([])
                setCartRefreshTrigger((prev) => prev + 1)
              }}
              onNavigateToPayment={(checkoutUrl) => {
                console.log(
                  "[AppNavigator] onNavigateToPayment called with URL:",
                  checkoutUrl
                )
                setPaymentCheckoutUrl(checkoutUrl)
                setShowOrderSuccess(false)
                setPaymentSourceScreen("checkout")
                setShowPaymentWebView(true)
              }}
              onPayLater={() => {
                console.log("[AppNavigator] Pay later clicked")
                setShowOrderSuccess(false)
                setShowCheckout(false)
                setCheckoutOrderData(null)
                setPurchasesStatus("pending")
                setShowPurchases(true)
              }}
            />
          </View>
        )}

        {showPaymentWebView && paymentCheckoutUrl && (
          <View style={styles.cartScreenOverlay}>
            <PaymentWebViewScreen
              checkoutUrl={paymentCheckoutUrl}
              isDarkMode={isDarkMode}
              onBack={() => {
                setShowPaymentWebView(false)
                if (paymentSourceScreen === "purchases") {
                  setShowPurchases(true)
                } else {
                  setShowOrderSuccess(true)
                }
                setPaymentCheckoutUrl("")
              }}
              onPaymentSuccess={() => {
                console.log(
                  "[AppNavigator] Payment successful - fetching order and user details"
                )
                setShowPaymentWebView(false)
                setShowCheckout(false)
                setShowOrderSuccess(false)
                setCheckoutOrderData(null)
                setCheckoutItem(null)
                setPaymentCheckoutUrl("")

                // Fetch latest order and user info in parallel
                if (token) {
                  const headers = { Authorization: `Bearer ${token}` }

                  Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/orders/history`, {
                      headers,
                    }),
                    axios.get(`${API_CONFIG.BASE_URL}/auth/me`, { headers }),
                  ])
                    .then(([orderRes, userRes]) => {
                      const orders = orderRes.data?.orders || []
                      const userData = userRes.data?.data || userRes.data || {}

                      if (orders.length > 0) {
                        const latestOrder = orders[0]
                        console.log(
                          "[AppNavigator] Latest order fetched:",
                          latestOrder
                        )
                        console.log(
                          "[AppNavigator] User data fetched:",
                          userData
                        )

                        const confirmationData = {
                          order_number: latestOrder.order_number,
                          transaction_id:
                            latestOrder.transaction_id || latestOrder.id,
                          amount: latestOrder.total_amount,
                          payment_method: latestOrder.payment_method,
                          product_name: latestOrder.items?.[0]?.name || "Order",
                          quantity:
                            latestOrder.items?.reduce(
                              (sum: number, item: any) => sum + item.quantity,
                              0
                            ) || 1,
                          customer_name:
                            userData.name ||
                            userData.full_name ||
                            latestOrder.customer_name ||
                            "Customer",
                          customer_email:
                            userData.email || latestOrder.customer_email,
                          customer_phone:
                            userData.phone ||
                            userData.mobile ||
                            latestOrder.customer_phone,
                          delivery_address: latestOrder.delivery_address,
                          shipping_fee: latestOrder.shipping_fee || 0,
                          created_at: latestOrder.created_at,
                        }

                        setPaymentConfirmationData(confirmationData)
                        setShowPaymentConfirmation(true)
                      }
                    })
                    .catch((err) => {
                      console.error(
                        "[AppNavigator] Error fetching order or user data:",
                        err
                      )
                      setShowPaymentSuccess(true)
                    })

                  // Refresh cart state after successful payment.
                  // The backend webhook marks only the purchased items as completed.
                  axios
                    .get(`${API_CONFIG.BASE_URL}/cart`, { headers })
                    .then((res) => {
                      setCartCount(extractCount(res.data))
                      setCartRefreshTrigger((prev) => prev + 1)
                      console.log(
                        "[AppNavigator] Cart refreshed after successful payment"
                      )
                    })
                    .catch((err) => {
                      console.error(
                        "Failed to refresh cart after payment:",
                        err
                      )
                    })
                }
              }}
            />
          </View>
        )}

        {showPaymentConfirmation && paymentConfirmationData && (
          <View style={styles.cartScreenOverlay}>
            <PaymentSuccessScreen
              orderData={paymentConfirmationData}
              isDarkMode={isDarkMode}
              onClose={() => {
                console.log(
                  "[AppNavigator] onContinueShopping called - closing PaymentSuccessScreen"
                )
                setShowPaymentConfirmation(false)
                setPaymentConfirmationData(null)
                setActiveTab("home")
                setPurchasesStatus("paid")
              }}
              onViewOrders={() => {
                setShowPaymentConfirmation(false)
                setPaymentConfirmationData(null)
                setShowPurchases(true)
                setPurchasesStatus("paid")
              }}
            />
          </View>
        )}

        {showPaymentSuccess && (
          <View style={styles.cartScreenOverlay}>
            <PaymentSuccessScreen
              isDarkMode={isDarkMode}
              onClose={() => {
                setShowPaymentSuccess(false)
                setPurchasesStatus("paid")
                setShowPurchases(true)
              }}
            />
          </View>
        )}

        {showPaymentCancel && (
          <View style={styles.cartScreenOverlay}>
            <PaymentCancelScreen
              isDarkMode={isDarkMode}
              onRetry={() => {
                setShowPaymentCancel(false)
                setShowPurchases(true)
              }}
              onClose={() => {
                setShowPaymentCancel(false)
                setShowPurchases(true)
              }}
            />
          </View>
        )}

        <AffiliateReferralModal
          visible={showAffiliateReferralModal}
          onClose={() => setShowAffiliateReferralModal(false)}
          userName={enrichedUser?.name}
          username={enrichedUser?.username}
          referralTree={referralTree}
          isDarkMode={isDarkMode}
          loading={affiliateLoading}
          onViewNetwork={() => {
            setShowAffiliateReferralModal(false)
            useModalStore.getState().openReferralNetwork()
          }}
        />

        {/* Info-page overlays (About Us, Privacy Policy, FAQs, etc.) — state in
            the Zustand modal store, rendered here so toggling them no longer
            re-renders the whole AppNavigator. */}
        <ModalHost
          isDarkMode={isDarkMode}
          token={token}
          user={enrichedUser}
          wishlistItems={wishlistItems}
          onWishlistChange={invalidateWishlist}
          referralTree={referralTree}
          onPVEarnerProductPress={(id) => {
            setPreviousSearchQuery(null)
            setPreviousTab(activeTab)
            setSelectedProductId(id)
          }}
          onPVEarnerShopPress={() => {
            setPreviousTab(activeTab)
            setActiveTab("shop")
          }}
        />

        {/* Account overlays (settings ↔ security ↔ profile details ↔ profile
            edit) — visibility + transitions live in the Zustand modal store; the
            leaf couplings below stay owned by AppNavigator. */}
        <AccountOverlayHost
          isDarkMode={isDarkMode}
          token={token}
          user={enrichedUser}
          cartCount={cartCount}
          setIsDarkMode={setIsDarkMode}
          onLogout={onLogout}
          onUserUpdate={onUserUpdate}
          onOpenCart={() => setShowCart(true)}
          onGoogleLinked={() =>
            setLinkedAccountsRefreshTrigger((prev) => prev + 1)
          }
          onProfileSave={handleProfileSave}
        />

        {showPurchases && (
          <View style={styles.cartScreenOverlay}>
            <PurchasesScreen
              token={token}
              status={purchasesStatus}
              isDarkMode={isDarkMode}
              initialOrderId={purchasesInitialOrderId}
              onBack={() => {
                setShowPurchases(false)
                setPurchasesInitialOrderId(undefined)
              }}
              onProductPress={(productId) => {
                setShowPurchases(false)
                setPreviousTab(activeTab)
                setSelectedProductId(productId)
              }}
              onProceedToPayment={(checkoutUrl) => {
                setPaymentCheckoutUrl(checkoutUrl)
                setShowPurchases(false)
                setPaymentSourceScreen("purchases")
                setShowPaymentWebView(true)
              }}
              onBuyAgain={(items) => {
                // Transform order items to checkout format
                const checkoutItems = items.map((item) => ({
                  product_id: item.product_id,
                  product_name: item.name,
                  product_image: item.image,
                  product_price_member: item.price,
                  quantity: item.quantity,
                  variant_color: item.selected_color,
                  variant_size: item.selected_size,
                  variant_type: item.selected_type,
                  brand_name: item.brand_name,
                  brand_id: item.brand_id,
                }))
                setCheckoutCartItems(checkoutItems)
                setShowPurchases(false)
                setCheckoutSource("cart")
                setShowCheckout(true)
              }}
            />
          </View>
        )}

        {showShippingAddressScreen && shippingAddressScreenData && (
          <View style={styles.cartScreenOverlay}>
            <ShippingAddressSelectionScreen
              addresses={shippingAddressScreenData.addresses}
              selectedAddress={shippingAddressScreenData.selectedAddress}
              isDarkMode={isDarkMode}
              onBack={() => setShowShippingAddressScreen(false)}
              onSelectAddress={(address) => {
                shippingAddressScreenData.onSelect(address)
                setShowShippingAddressScreen(false)
              }}
            />
          </View>
        )}

        {/* Referral signup flow (intro → signup → OTP). Step state lives in the
            Zustand store; the shared deep-link data is passed in here. */}
        {referralCodeFromDeepLink && (
          <ReferralSignupFlow
            referralCode={referralCodeFromDeepLink}
            referrerProfile={referrerProfileData}
            isDarkMode={isDarkMode}
            onExit={() => {
              setReferralCodeFromDeepLink(null)
              setReferrerProfileData(null)
            }}
          />
        )}

        {/* Exit Confirmation Modal */}
        <Modal
          visible={showExitConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExitConfirm(false)}
        >
          <Pressable
            style={styles.exitModalOverlay}
            onPress={() => setShowExitConfirm(false)}
            activeOpacity={1}
          >
            <View style={styles.exitModalContent}>
              <Text style={styles.exitModalTitle}>Close App</Text>
              <Text style={styles.exitModalMessage}>
                Do you want to close the application?
              </Text>

              <View style={styles.exitModalButtons}>
                <Pressable
                  style={[styles.exitModalButton, styles.exitModalButtonCancel]}
                  onPress={() => setShowExitConfirm(false)}
                >
                  <Text style={styles.exitModalButtonCancelText}>Continue</Text>
                </Pressable>

                <Pressable
                  style={[styles.exitModalButton, styles.exitModalButtonClose]}
                  onPress={() => BackHandler.exitApp()}
                >
                  <Text style={styles.exitModalButtonCloseText}>Close App</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </NavigationProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fbff" },
  safe: { flex: 1, backgroundColor: Colors.white },
  body: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  navBarContainer: {
    backgroundColor: Colors.white,
  },
  navBarContainerDark: {
    backgroundColor: "#1f2937",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    overflow: "visible",
  },
  navBarDark: {
    backgroundColor: "#1f2937",
    borderTopColor: "#374151",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
    paddingVertical: 6,
  },
  indicator: {
    height: 3,
    width: "100%",
    alignItems: "center",
    marginBottom: 2,
  },
  indicatorLine: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sky,
    marginTop: -1,
  },
  iconWrap: {
    position: "relative",
  },
  homeLogoImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  shopLogoImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
    marginTop: -4,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeDark: {
    borderColor: "#111827",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 11,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  navLabelActive: {
    color: Colors.sky,
    fontWeight: "700",
  },
  navLabelDark: {
    color: "#d1d5db",
  },
  navLabelActiveDark: {
    color: "#38bdf8",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarActive: {
    borderColor: Colors.sky,
    backgroundColor: "#e0f2fe",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  avatarInitialActive: {
    color: Colors.sky,
  },
  shopItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    paddingBottom: 4,
  },
  shopSlot: {
    height: 37,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible",
  },
  shopDiamond: {
    width: 48,
    height: 48,
    backgroundColor: Colors.sky,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    shadowColor: Colors.sky,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  shopDiamondActive: {
    backgroundColor: Colors.skyDark,
  },
  shopDiamondInner: {
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    height: "100%",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
  },
  menuPanel: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: Colors.white,
    padding: 18,
    paddingTop: 36,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "100%",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.white,
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2b2f38",
  },
  menuText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  tokenModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 380,
  },
  tokenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
  },
  tokenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  tokenBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tokenText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  tokenCopyBtn: {
    backgroundColor: Colors.sky,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  tokenCopyText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
  tokenCloseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tokenCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  cartScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  exitModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 12,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  exitModalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  exitModalButtons: {
    width: "100%",
    gap: 10,
  },
  exitModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  exitModalButtonCancel: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  exitModalButtonCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  exitModalButtonClose: {
    backgroundColor: Colors.error,
  },
  exitModalButtonCloseText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
})
