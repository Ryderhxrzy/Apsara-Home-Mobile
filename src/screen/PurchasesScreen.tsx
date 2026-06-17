// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  BackHandler,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  Clipboard,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { API_CONFIG } from "../config/api"
import Toast from "react-native-toast-message"
import { useOrders } from "../hooks/query/useOrders"
import styles from "../styles/PurchasesScreen.styles"
const { height: screenHeight } = Dimensions.get("window")

interface OrderItem {
  id: number
  product_id: number
  name: string
  image?: string
  quantity: number
  price: number
  selected_color?: string
  selected_size?: string
  selected_type?: string
  brand_name?: string
  brand_id?: number
}

interface Order {
  id: number
  order_number: string
  mobile_order_id: string
  status:
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "to_receive"
    | "delivered"
    | "cancelled"
    | "return"
  created_at: string
  total_amount: number
  shipping_fee: number
  payment_method: string
  tracking_number?: string
  checkout_id?: string
  items: OrderItem[]
}

interface PurchasesScreenProps {
  token?: string | null
  status?:
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "to_receive"
    | "delivered"
    | "cancelled"
    | "return"
  isDarkMode?: boolean
  initialOrderId?: string
  onBack?: () => void
  onProceedToPayment?: (checkoutUrl: string) => void
  onProductPress?: (productId: number) => void
  onBuyAgain?: (items: OrderItem[]) => void
}

const STATUS_CONFIG = {
  pending: {
    icon: "time-outline",
    color: "#ef4444",
    label: "Pending",
    description: "Awaiting payment confirmation",
  },
  paid: {
    icon: "checkmark",
    color: "#06b6d4",
    label: "Paid",
    description: "Payment confirmed, processing order",
  },
  processing: {
    icon: "hourglass-outline",
    color: "#f59e0b",
    label: "Processing",
    description: "Order is being prepared",
  },
  shipped: {
    icon: "car-outline",
    color: "#3b82f6",
    label: "To Ship",
    description: "Ready to be shipped",
  },
  to_receive: {
    icon: "bag-outline",
    color: "#8b5cf6",
    label: "To Receive",
    description: "Package arrived, waiting for you",
  },
  delivered: {
    icon: "checkmark-circle-outline",
    color: "#10b981",
    label: "Delivered",
    description: "Order completed",
  },
  cancelled: {
    icon: "close-circle-outline",
    color: "#ef4444",
    label: "Cancelled",
    description: "Order was cancelled",
  },
  return: {
    icon: "return-down-back-outline",
    color: "#f97316",
    label: "Return",
    description: "Returned order",
  },
}

const ALL_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "to_receive",
  "delivered",
  "cancelled",
  "return",
] as const

const normalizeStatusKey = (status?: string) => {
  const s = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
  if (s === "to_ship" || s === "shipping") return "shipped"
  if (s === "out_for_delivery") return "to_receive"
  if (s === "to_receive" || s === "toreceive") return "to_receive"
  if (s === "cancelled" || s === "canceled") return "cancelled"
  if (s === "return" || s === "returned" || s === "returns") return "return"
  if (s in STATUS_CONFIG) return s as keyof typeof STATUS_CONFIG
  return "pending" as keyof typeof STATUS_CONFIG
}

export default function PurchasesScreen({
  token,
  status: initialStatus = "pending",
  isDarkMode = false,
  initialOrderId,
  onBack,
  onProceedToPayment,
  onProductPress,
  onBuyAgain,
}: PurchasesScreenProps) {
  const insets = useSafeAreaInsets()
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({})
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null)
  const [cancelLoading, setCancelLoading] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<any>(initialStatus)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Follow the incoming status prop (e.g. opened from a notification tap on a
  // specific order status) even if the screen is already mounted. Adjusting
  // state during render (not an effect) — converges via the prev-value guard.
  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus)
  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus)
    setSelectedStatus(initialStatus)
  }

  const {
    data: allOrders = [],
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    refetch: refetchOrders,
  } = useOrders({ token })

  // Tab/status filtering is done client-side from the full orders list
  const orders = useMemo(
    () =>
      (allOrders as Order[]).filter(
        (order) =>
          normalizeStatusKey(order.status) ===
          normalizeStatusKey(selectedStatus)
      ),
    [allOrders, selectedStatus]
  )

  const statusCounts = useMemo(
    () =>
      (allOrders as Order[]).reduce(
        (acc: Record<string, number>, order: Order) => {
          const key = normalizeStatusKey(order.status)
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {}
      ),
    [allOrders]
  )

  // Only show the full-screen loader on the very first load (no cached data)
  const loading = ordersLoading && allOrders.length === 0
  // Pull-to-refresh indicator: fetching while we already have data
  const refreshing = ordersFetching && !ordersLoading
  const [detailSlideAnim] = useState(new Animated.Value(0))
  const [cancellationReasons, setCancellationReasons] = useState<
    Record<string, string>
  >({})
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false)
  const [selectedCancellationReason, setSelectedCancellationReason] = useState<
    string | null
  >(null)
  const [cancelReasonLoading, setCancelReasonLoading] = useState(false)
  const [cancelReasonSlideAnim] = useState(new Animated.Value(screenHeight))
  const closeDetailModal = () => {
    Animated.timing(detailSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowDetailModal(false))
  }

  const handleCopy = (value: string, label = "Copied") => {
    if (!value) return
    Clipboard.setString(value)
    Toast.show({ type: "success", text1: label, text2: value })
  }
  const detailPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
    onPanResponderMove: (_, { dy }) => {
      if (dy > 0) {
        detailSlideAnim.setValue(1 - dy / screenHeight)
      }
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy > 100 || vy > 0.5) {
        Animated.timing(detailSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowDetailModal(false))
      } else {
        Animated.timing(detailSlideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
    },
  })

  const cancelReasonPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
    onPanResponderMove: (_, { dy }) => {
      if (dy > 0) {
        cancelReasonSlideAnim.setValue(screenHeight * (dy / screenHeight))
      }
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy > 100 || vy > 0.5) {
        Animated.timing(cancelReasonSlideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowCancelReasonModal(false))
      } else {
        Animated.timing(cancelReasonSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
    },
  })

  useEffect(() => {
    if (showDetailModal) {
      detailSlideAnim.setValue(0)
      Animated.timing(detailSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [showDetailModal, detailSlideAnim])

  useEffect(() => {
    if (showCancelReasonModal) {
      cancelReasonSlideAnim.setValue(screenHeight)
      Animated.timing(cancelReasonSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [showCancelReasonModal, cancelReasonSlideAnim])

  const detailTranslateY = detailSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  })

  const detailBackdropOpacity = detailSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const cancelReasonTranslateY = cancelReasonSlideAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [0, screenHeight],
  })

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  // (Switching tabs clears any open detail modal — handled in the tab onPress so
  // it only fires on a user tab change, not the programmatic deep-link change.)

  // COMMENTED OUT: Fetch cancellation reasons - API endpoint returns 404
  // useEffect(() => {
  //   const fetchCancellationReasons = async () => {
  //     if (!token) return;
  //     try {
  //       const headers = { Authorization: `Bearer ${token}` };
  //       const response = await axios.get(
  //         `${API_CONFIG.BASE_URL}/orders/cancellation-reasons`,
  //         { headers }
  //       );
  //       setCancellationReasons(response.data?.cancellation_reasons || {});
  //     } catch (error) {
  //       console.error('Failed to fetch cancellation reasons:', error);
  //     }
  //   };
  //   fetchCancellationReasons();
  // }, [token]);

  // Open the deep-linked order's detail modal once, after orders load. Adjusting
  // state during render (not an effect); the didOpen flag makes it run a single
  // time once the orders list is available (replaces a render-unsafe ref write).
  const [didOpenInitialOrder, setDidOpenInitialOrder] = useState(false)
  if (initialOrderId && allOrders.length > 0 && !didOpenInitialOrder) {
    const order = (allOrders as Order[]).find(
      (o) =>
        o.mobile_order_id === initialOrderId ||
        o.order_number === initialOrderId ||
        o.checkout_id === initialOrderId ||
        o.id.toString() === initialOrderId
    )
    setDidOpenInitialOrder(true)
    if (order) {
      setSelectedOrder(order)
      setShowDetailModal(true)
      setSelectedStatus(normalizeStatusKey(order.status))
    }
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack?.()
        return true
      }
    )

    return () => backHandler.remove()
  }, [onBack])

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<number, string> = {}
      orders.forEach((order) => {
        const createdTime = new Date(order.created_at).getTime()
        const expiryTime = createdTime + 24 * 60 * 60 * 1000 // 24 hours
        const now = new Date().getTime()
        const diff = expiryTime - now

        if (diff <= 0) {
          newTimeLeft[order.id] = "Expired"
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          newTimeLeft[order.id] = `${hours}h ${minutes}m ${seconds}s`
        }
      })
      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [orders])

  const handleRefresh = () => {
    refetchOrders()
  }

  const handleProceedToPayment = async (order: Order) => {
    console.log("[PurchasesScreen] handleProceedToPayment called with order:", {
      id: order.id,
      order_number: order.order_number,
      fullOrder: order,
    })

    if (paymentLoading === order.id) {
      console.log("[PurchasesScreen] Already loading for this order")
      return
    }

    if (!token) {
      console.log("[PurchasesScreen] No token found")
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Authentication required",
      })
      return
    }

    if (!order.order_number) {
      console.log("[PurchasesScreen] No order_number found in order")
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Order number not found",
      })
      return
    }

    setPaymentLoading(order.id)
    try {
      console.log("[PurchasesScreen] Proceeding to payment:", {
        orderNumber: order.order_number,
      })

      const apiUrl = `${API_CONFIG.BASE_URL}/mobile/payments/${order.order_number}/proceed`
      console.log("[PurchasesScreen] Calling API:", apiUrl)

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[PurchasesScreen] ✅ API SUCCESS:", {
        status: response.status,
        checkoutUrl: response.data?.checkout_url,
        hasCheckoutUrl: !!response.data?.checkout_url,
        fullResponse: response.data,
      })

      if (response.data?.checkout_url) {
        console.log(
          "[PurchasesScreen] Calling onProceedToPayment with URL:",
          response.data.checkout_url
        )
        Toast.show({
          type: "success",
          text1: "Redirecting to Payment",
          text2: "Opening PayMongo checkout...",
        })
        onProceedToPayment?.(response.data.checkout_url)
        console.log("[PurchasesScreen] onProceedToPayment callback executed")
      } else {
        console.log("[PurchasesScreen] No checkout_url in response")
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No checkout URL received from server",
        })
      }
    } catch (error: any) {
      console.error("[PurchasesScreen] ❌ API ERROR:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      })

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.statusText ||
        "Failed to proceed to payment"

      Toast.show({
        type: "error",
        text1: "Payment Error",
        text2: errorMsg,
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  // COMMENTED OUT: Cancel order functionality - API endpoint returns 404
  // const handleCancelOrder = async (order: Order) => {
  //   if (!token) {
  //     Toast.show({ type: 'error', text1: 'Error', text2: 'Authentication required' });
  //     return;
  //   }

  //   const normalizedStatus = normalizeStatusKey(order.status);

  //   // Allow cancellation for pending and paid orders only
  //   if (normalizedStatus !== 'pending' && normalizedStatus !== 'paid') {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Cannot Cancel',
  //       text2: 'Orders can only be cancelled if pending or paid.',
  //     });
  //     return;
  //   }

  //   setSelectedOrder(order);
  //   setSelectedCancellationReason(null);
  //   setShowCancelReasonModal(true);
  // };

  // const handleConfirmCancelWithReason = async () => {
  //   if (!selectedOrder || !token) {
  //     Toast.show({ type: 'error', text1: 'Error', text2: 'Order or token missing' });
  //     return;
  //   }

  //   if (cancelLoading === selectedOrder.id) return;

  //   setCancelLoading(selectedOrder.id);
  //   setCancelReasonLoading(true);

  //   try {
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const payload: any = {};

  //     if (selectedCancellationReason) {
  //       payload.cancellation_reason = selectedCancellationReason;
  //     }

  //     // Try the correct endpoint with order ID
  //     await axios.post(
  //       `${API_CONFIG.BASE_URL}/orders/${selectedOrder.id}/cancel`,
  //       payload,
  //       { headers }
  //     );

  //     Toast.show({
  //       type: 'success',
  //       text1: 'Order Cancelled',
  //       text2: `Order #${selectedOrder.order_number} has been cancelled. Refund will be processed within 3-5 business days.`,
  //     });

  //     setShowDetailModal(false);
  //     setShowCancelReasonModal(false);
  //     setSelectedOrder(null);
  //     setSelectedCancellationReason(null);
  //     fetchOrders();
  //   } catch (error: any) {
  //     console.error('Cancel error:', error);
  //     const errorMsg = error?.response?.data?.message
  //       || error?.response?.data?.error
  //       || 'Failed to cancel order';
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Cancel Failed',
  //       text2: errorMsg,
  //     });
  //   } finally {
  //     setCancelLoading(null);
  //     setCancelReasonLoading(false);
  //   }
  // };

  const handleBuyAgain = (order: Order) => {
    if (!order || !order.items || order.items.length === 0) {
      Toast.show({
        type: "error",
        text1: "No Items",
        text2: "This order has no items to repurchase",
      })
      return
    }

    // Call the onBuyAgain callback with the order items
    if (onBuyAgain) {
      onBuyAgain(order.items)
      setShowDetailModal(false)
      setSelectedOrder(null)
    } else {
      Toast.show({
        type: "info",
        text1: "Buy Again",
        text2: `Ready to purchase ${order.items.length} item(s) again`,
      })
      setShowDetailModal(false)
      setSelectedOrder(null)
    }
  }

  const statusConfig = STATUS_CONFIG[normalizeStatusKey(selectedStatus)]

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.headerBackground,
          {
            backgroundColor: colors.containerBg,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerGreeting, { color: colors.text }]}>
            My Purchases
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSec }]}>
            Track your orders
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Bar at Top */}
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            borderBottomColor: colors.border,
            paddingHorizontal: 0,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterContent,
            { paddingHorizontal: 8 },
          ]}
          scrollEventThrottle={16}
        >
          {ALL_STATUSES.map((filterStatus) => {
            const config =
              STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]
            const isSelected = selectedStatus === filterStatus
            return (
              <TouchableOpacity
                key={filterStatus}
                style={[
                  styles.filterButton,
                  isSelected && [
                    styles.filterButtonActive,
                    { backgroundColor: Colors.sky },
                  ],
                ]}
                onPress={() => {
                  setSelectedStatus(filterStatus)
                  setShowDetailModal(false)
                  setSelectedOrder(null)
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected && { color: Colors.white, fontWeight: "700" },
                  ]}
                >
                  {config.label}
                </Text>
                {Number(statusCounts[filterStatus] || 0) > 0 && (
                  <View
                    style={[
                      styles.filterCountBadge,
                      isSelected && styles.filterCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountBadgeText,
                        isSelected && styles.filterCountBadgeTextActive,
                      ]}
                    >
                      {statusCounts[filterStatus] > 99
                        ? "99+"
                        : statusCounts[filterStatus]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sky} />
            <Text style={[styles.loadingText, { color: colors.textSec }]}>
              Loading orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="inbox" size={64} color={colors.textSec} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Purchases Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>
              You don&apos;t have any {statusConfig.label.toLowerCase()} orders
              yet
            </Text>

            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() => {
                // Best-effort redirect to Shop screen.
                // @ts-ignore
                global?.Linking?.openURL?.("apsarahome://shop")
              }}
            >
              <Ionicons name="cart-outline" size={16} color={Colors.white} />
              <Text style={styles.shopNowBtnText}>Shop now!</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: order }) => (
              <TouchableOpacity
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: colors.containerBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedOrder(order)
                  setShowDetailModal(true)
                }}
                activeOpacity={0.7}
              >
                {/* Order Header */}
                <View
                  style={[
                    styles.orderHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>
                      Order #{order.order_number}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textSec }]}>
                      {new Date(order.created_at).toLocaleDateString()}{" "}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusConfig.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={statusConfig.icon as any}
                      size={16}
                      color={statusConfig.color}
                    />
                    <Text
                      style={[styles.statusText, { color: statusConfig.color }]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Order Items */}
                <View
                  style={[
                    styles.itemsContainer,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  {(() => {
                    // Consolidate items by product_id
                    const consolidatedItems = order.items.reduce(
                      (acc: any[], item) => {
                        const existing = acc.find(
                          (i) => i.product_id === item.product_id
                        )
                        if (existing) {
                          existing.quantity += item.quantity
                          existing.totalPrice += item.price * item.quantity
                        } else {
                          acc.push({
                            ...item,
                            totalPrice: item.price * item.quantity,
                          })
                        }
                        return acc
                      },
                      []
                    )

                    return consolidatedItems.map((item, index) => (
                      <TouchableOpacity
                        key={`${item.product_id}-${index}`}
                        style={[
                          styles.itemRow,
                          index !== consolidatedItems.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          },
                        ]}
                        onPress={() => onProductPress?.(item.product_id)}
                        activeOpacity={0.7}
                      >
                        {item.image && (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.itemImage}
                            contentFit="contain"
                            transition={200}
                          />
                        )}
                        <View style={[styles.itemInfo, { marginRight: 12 }]}>
                          <Text
                            style={[
                              styles.itemName,
                              { color: colors.text, marginBottom: 6 },
                            ]}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.itemDetailsRow}>
                            <Text
                              style={[
                                styles.itemQty,
                                { color: colors.textSec },
                              ]}
                            >
                              Qty: {item.quantity}
                            </Text>
                            {(item.selected_color ||
                              item.selected_size ||
                              item.selected_type) && (
                              <Text
                                style={[
                                  styles.itemVariant,
                                  { color: colors.textSec, marginLeft: 8 },
                                ]}
                              >
                                {[
                                  item.selected_color,
                                  item.selected_size,
                                  item.selected_type,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.itemPriceContainer}>
                          <Text
                            style={[styles.itemPrice, { color: Colors.sky }]}
                          >
                            ₱{item.totalPrice.toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  })()}
                </View>

                {/* Shipping Fee */}
                {order.shipping_fee > 0 && (
                  <View
                    style={[
                      styles.shippingFeeRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.shippingLabel, { color: colors.textSec }]}
                    >
                      Shipping Fee
                    </Text>
                    <Text
                      style={[styles.shippingPrice, { color: colors.text }]}
                    >
                      ₱{order.shipping_fee.toLocaleString()}
                    </Text>
                  </View>
                )}

                {/* Order Total */}
                <View style={styles.orderFooter}>
                  <View style={styles.totalRow}>
                    <Text
                      style={[styles.totalLabel, { color: colors.textSec }]}
                    >
                      Total Amount
                    </Text>
                    <Text style={[styles.totalPrice, { color: Colors.sky }]}>
                      ₱{order.total_amount.toLocaleString()}
                    </Text>
                  </View>

                  {/* Payment Method */}
                  <View style={styles.paymentMethodRow}>
                    <Text
                      style={[
                        styles.paymentMethodLabel,
                        { color: colors.textSec },
                      ]}
                    >
                      Payment: {order.payment_method}
                    </Text>
                    {selectedStatus === "pending" && (
                      <View style={styles.payUntilInline}>
                        <Ionicons
                          name={
                            timeLeft[order.id] === "Expired"
                              ? "alert-circle"
                              : "time"
                          }
                          size={12}
                          color={
                            timeLeft[order.id] === "Expired"
                              ? Colors.error
                              : Colors.sky
                          }
                        />
                        <Text
                          style={[
                            styles.payUntilInlineText,
                            {
                              color:
                                timeLeft[order.id] === "Expired"
                                  ? Colors.error
                                  : Colors.sky,
                            },
                          ]}
                        >
                          {timeLeft[order.id] || "Loading..."}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Cancellation Reason (for cancelled orders) */}
                  {selectedStatus === "cancelled" && order.refund_reason && (
                    <View
                      style={[
                        styles.cancellationReasonBox,
                        {
                          backgroundColor: `${Colors.error}10`,
                          borderColor: Colors.error,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color={Colors.error}
                          style={{ marginTop: 2 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.cancellationReasonLabel,
                              { color: colors.text },
                            ]}
                          >
                            Cancellation Reason
                          </Text>
                          <Text
                            style={[
                              styles.cancellationReasonText,
                              { color: colors.textSec },
                            ]}
                          >
                            {order.refund_reason}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Order Actions */}
                  {(selectedStatus === "pending" ||
                    selectedStatus === "paid") && (
                    <View style={styles.paymentSection}>
                      <View style={styles.listActionsRow}>
                        {/* COMMENTED OUT: Cancel order button - API endpoint returns 404
                        <TouchableOpacity
                          style={[styles.cancelListBtn, cancelLoading === order.id && { opacity: 0.6 }]}
                          onPress={() => handleCancelOrder(order)}
                          disabled={cancelLoading === order.id}
                        >
                          {cancelLoading === order.id ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <>
                              <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                              <Text style={styles.paymentBtnText}>Cancel Order</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        */}

                        {selectedStatus === "pending" && (
                          <TouchableOpacity
                            style={[
                              styles.paymentBtn,
                              paymentLoading === order.id && { opacity: 0.6 },
                            ]}
                            onPress={() => handleProceedToPayment(order)}
                            disabled={paymentLoading === order.id}
                          >
                            {paymentLoading === order.id ? (
                              <ActivityIndicator
                                size="small"
                                color={Colors.white}
                              />
                            ) : (
                              <>
                                <Ionicons
                                  name="card"
                                  size={16}
                                  color={Colors.white}
                                />
                                <Text style={styles.paymentBtnText}>
                                  Proceed to Payment
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Buy Again Button (for cancelled orders) */}
                  {selectedStatus === "cancelled" && (
                    <View style={{ marginTop: 12 }}>
                      <TouchableOpacity
                        style={styles.paymentBtn}
                        onPress={() => handleBuyAgain(order)}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={16}
                          color={Colors.white}
                        />
                        <Text style={styles.paymentBtnText}>Buy Again</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingVertical: 8,
              paddingBottom: 16,
              gap: 8,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.sky}
              />
            }
          />
        )}
      </View>

      {/* Order Details Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={closeDetailModal}
      >
        <View style={styles.sheetBackdrop}>
          <Animated.View
            style={[
              styles.sheetBackdropLayer,
              { opacity: detailBackdropOpacity },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeDetailModal}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.bg,
                transform: [{ translateY: detailTranslateY }],
              },
            ]}
            {...detailPanResponder.panHandlers}
          >
            {/* Sheet Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.sheetHandle,
                  { backgroundColor: isDarkMode ? "#475569" : "#cbd5e1" },
                ]}
              />
            </View>
            {/* Sheet Header */}
            <View
              style={[
                styles.sheetHeader,
                {
                  backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sheetTitle,
                  { color: isDarkMode ? "#f8fafc" : Colors.text },
                ]}
              >
                Order Details
              </Text>
            </View>

            {selectedOrder && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                  styles.modalContent,
                  { paddingBottom: 30 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {/* Order Number & Status */}
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textSec }]}
                    >
                      Order Number
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      #{selectedOrder.order_number}
                    </Text>
                  </View>
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textSec }]}
                    >
                      Order Date
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textSec }]}
                    >
                      Status
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: `${STATUS_CONFIG[normalizeStatusKey(selectedOrder.status)].color}20`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          STATUS_CONFIG[
                            normalizeStatusKey(selectedOrder.status)
                          ].icon as any
                        }
                        size={14}
                        color={
                          STATUS_CONFIG[
                            normalizeStatusKey(selectedOrder.status)
                          ].color
                        }
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              STATUS_CONFIG[
                                normalizeStatusKey(selectedOrder.status)
                              ].color,
                          },
                        ]}
                      >
                        {
                          STATUS_CONFIG[
                            normalizeStatusKey(selectedOrder.status)
                          ].label
                        }
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Order Items */}
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Items Ordered
                  </Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={`${item.product_id}-${index}`}>
                      <View style={styles.detailItemRow}>
                        {item.image && (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.detailItemImage}
                            contentFit="contain"
                            transition={200}
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.itemName, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[styles.itemQty, { color: colors.textSec }]}
                          >
                            Qty: {item.quantity}
                          </Text>
                          {(item.selected_color ||
                            item.selected_size ||
                            item.selected_type) && (
                            <Text
                              style={[
                                styles.itemVariant,
                                { color: colors.textSec },
                              ]}
                            >
                              {[
                                item.selected_color,
                                item.selected_size,
                                item.selected_type,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.itemPrice, { color: Colors.sky }]}>
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </Text>
                      </View>
                      {index < selectedOrder.items.length - 1 && (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>

                {/* Order Summary */}
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Order Summary
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.textSec }]}
                    >
                      Subtotal
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      ₱
                      {(
                        selectedOrder.total_amount - selectedOrder.shipping_fee
                      ).toLocaleString()}
                    </Text>
                  </View>
                  {selectedOrder.shipping_fee > 0 && (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[styles.summaryLabel, { color: colors.textSec }]}
                      >
                        Shipping Fee
                      </Text>
                      <Text
                        style={[styles.summaryValue, { color: colors.text }]}
                      >
                        ₱{selectedOrder.shipping_fee.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: colors.text, fontWeight: "700" },
                      ]}
                    >
                      Total Amount
                    </Text>
                    <Text style={[styles.totalAmount, { color: Colors.sky }]}>
                      ₱{selectedOrder.total_amount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Payment & Delivery Info */}
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Payment & Delivery
                  </Text>
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textSec }]}
                    >
                      Payment Method
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedOrder.payment_method}
                    </Text>
                  </View>
                  {selectedOrder.tracking_number && (
                    <>
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <View style={styles.detailRow}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: colors.textSec },
                          ]}
                        >
                          Tracking Number
                        </Text>
                        <Pressable
                          style={styles.copyValue}
                          onPress={() =>
                            handleCopy(
                              selectedOrder.tracking_number,
                              "Tracking Number Copied"
                            )
                          }
                          hitSlop={8}
                        >
                          <Text
                            style={[styles.detailValue, { color: Colors.sky }]}
                          >
                            {selectedOrder.tracking_number}
                          </Text>
                          <Ionicons
                            name="copy-outline"
                            size={15}
                            color={Colors.sky}
                          />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
                {/* COMMENTED OUT: Cancel order button section - API endpoint returns 404
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.cancelBtn]}
                    onPress={() => handleCancelOrder(selectedOrder)}
                    disabled={cancelLoading === selectedOrder.id}
                    activeOpacity={0.7}
                  >
                    {cancelLoading === selectedOrder.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                        <Text style={styles.detailActionText}>Cancel Order</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {selectedOrder.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.detailActionBtn, styles.payBtn]}
                      onPress={() => handleProceedToPayment(selectedOrder)}
                      disabled={paymentLoading === selectedOrder.id}
                      activeOpacity={0.7}
                    >
                      {paymentLoading === selectedOrder.id ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <>
                          <Ionicons name="card-outline" size={16} color={Colors.white} />
                          <Text style={styles.detailActionText}>Proceed to Payment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
              */}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* COMMENTED OUT: Cancel Reason Modal - API endpoint returns 404 */}
      {false && (
        <Modal
          visible={showCancelReasonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCancelReasonModal(false)}
        >
          <View style={styles.sheetBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowCancelReasonModal(false)}
            />
            <Animated.View
              style={[
                styles.cancelReasonSheet,
                {
                  backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
                  transform: [{ translateY: cancelReasonTranslateY }],
                },
              ]}
              {...cancelReasonPanResponder.panHandlers}
            >
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.sheetHandle,
                    { backgroundColor: isDarkMode ? "#475569" : "#cbd5e1" },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.sheetHeader,
                  {
                    backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: isDarkMode ? "#f8fafc" : Colors.text },
                  ]}
                >
                  Reason for Cancellation
                </Text>
              </View>

              <ScrollView
                style={styles.reasonList}
                contentContainerStyle={styles.reasonListContent}
              >
                {Object.entries(cancellationReasons).length > 0 ? (
                  Object.entries(cancellationReasons).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.reasonOption,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor:
                            selectedCancellationReason === key
                              ? "#eff6ff"
                              : "transparent",
                        },
                      ]}
                      onPress={() => setSelectedCancellationReason(key)}
                    >
                      <View style={styles.reasonOptionContent}>
                        <Text
                          style={[
                            styles.reasonText,
                            {
                              color: colors.text,
                              fontWeight:
                                selectedCancellationReason === key
                                  ? "700"
                                  : "500",
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                      {selectedCancellationReason === key && (
                        <View style={styles.reasonCheckmark}>
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={Colors.sky}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.reasonText,
                      {
                        color: colors.textSec,
                        textAlign: "center",
                        marginTop: 20,
                      },
                    ]}
                  >
                    Loading reasons...
                  </Text>
                )}
              </ScrollView>

              <View style={styles.reasonActions}>
                <TouchableOpacity
                  style={[styles.reasonBtn, { backgroundColor: colors.border }]}
                  onPress={() => setShowCancelReasonModal(false)}
                  disabled={cancelReasonLoading}
                >
                  <Text style={[styles.reasonBtnText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reasonBtn,
                    {
                      backgroundColor: "#ef4444",
                      opacity:
                        !selectedCancellationReason || cancelReasonLoading
                          ? 0.6
                          : 1,
                    },
                  ]}
                  onPress={handleConfirmCancelWithReason}
                  disabled={!selectedCancellationReason || cancelReasonLoading}
                >
                  {cancelReasonLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.reasonBtnText}>Confirm Cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  )
}
