import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { getColors } from "../theme/theme"
import { API_CONFIG } from "../config/api"
import { orderService } from "../services/orderService"
import { ChatBotIcon } from "../components/ChatBot"
import { useNotifications } from "../hooks/useNotifications"
import { useNotificationList } from "../hooks/query/useNotificationList"
import { useQueryClient } from "@tanstack/react-query"
import styles from "../styles/NotificationsScreen.styles"

interface NotificationsScreenProps {
  token?: string | null
  userId?: string | number
  isDarkMode?: boolean
  onNavigateToPurchases?: (status: string, orderId?: string) => void
  isVisible?: boolean
}

export default function NotificationsScreen({
  token,
  userId,
  isDarkMode = false,
  onNavigateToPurchases,
  isVisible = true,
}: NotificationsScreenProps) {
  const queryClient = useQueryClient()
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("all")
  const [expandedNotificationId, setExpandedNotificationId] = useState<
    number | null
  >(null)
  const [loadingUpdates, setLoadingUpdates] = useState<Record<number, boolean>>(
    {}
  )

  const {
    data: notifications,
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useNotificationList(token)

  // Optimistically patch the cached notifications object in place.
  const patchNotifications = (updater: (prev: any) => any) =>
    queryClient.setQueryData(["notifications", token], updater)

  // Integrate with useNotifications for realtime updates
  useNotifications(userId || "", token || "", onNavigateToPurchases, () => {
    // Refresh notification list when realtime event is received
    if (isVisible) {
      refetch()
    }
  })

  const insets = useSafeAreaInsets()
  // Palette from the centralized theme (slate spine + sky accent).
  const t = getColors(isDarkMode)
  const colors = {
    bg: t.bgSubtle,
    containerBg: t.card,
    text: t.text,
    textSec: t.textSecondary,
    border: t.border,
    borderLight: t.divider,
    emptyIcon: t.primary,
    unreadBg: t.primarySoft,
  }

  const handleRefresh = () => {
    refetch()
  }

  const fetchNotificationUpdates = async (notificationId: number) => {
    if (!token) return
    setLoadingUpdates((prev) => ({ ...prev, [notificationId]: true }))
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/mobile/notifications/${notificationId}/updates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        // Update the notification with fetched updates
        patchNotifications((prev: any) => {
          if (!prev?.notifications) return prev
          const updated = prev.notifications.map((n: any) =>
            n.id === notificationId ? { ...n, updates: data.updates } : n
          )
          return { ...prev, notifications: updated }
        })
      }
    } catch (error) {
      console.error("Error fetching notification updates:", error)
    } finally {
      setLoadingUpdates((prev) => ({ ...prev, [notificationId]: false }))
    }
  }

  const toggleNotificationExpand = async (notificationId: number) => {
    if (expandedNotificationId === notificationId) {
      setExpandedNotificationId(null)
    } else {
      setExpandedNotificationId(notificationId)
      // Fetch updates if not already loaded
      const notification = notifications?.notifications.find(
        (n: any) => n.id === notificationId
      )
      if (notification && !notification.updates) {
        await fetchNotificationUpdates(notificationId)
      }
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "#10b981"
      case "warning":
        return "#f59e0b"
      case "error":
        return "#ef4444"
      case "info":
      default:
        return Colors.sky
    }
  }

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case "success":
        return "checkmark-circle"
      case "warning":
        return "warning"
      case "error":
        return "alert-circle"
      case "info":
      default:
        return "information-circle"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else if (isYesterday) {
      return (
        "Yesterday " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      )
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  const getFilteredNotifications = () => {
    if (!notifications?.notifications) return []
    if (filterType === "all") return notifications.notifications
    if (filterType === "unread")
      return notifications.notifications.filter((item: any) => !item.is_read)
    if (filterType === "read")
      return notifications.notifications.filter((item: any) => item.is_read)
    return notifications.notifications
  }

  const handleNotificationPress = async (item: any) => {
    const href = item?.href
    const orderId = item?.order_id

    console.log("[NotificationsScreen] Notification pressed:", {
      href,
      orderId,
    })

    if (token && item?.id) {
      try {
        await orderService.readNotification(token, item.id)
        patchNotifications((prev: any) => {
          if (!prev?.notifications) return prev
          const updated = prev.notifications.map((n: any) =>
            n.id === item.id ? { ...n, is_read: true } : n
          )
          const unreadCount = updated.filter((n: any) => !n.is_read).length
          return { ...prev, notifications: updated, unread_count: unreadCount }
        })
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // Prefer an explicit deep link (purchases://status[/order-id]); otherwise
    // fall back to the notification's own order status so order notifications
    // ("Order: Delivered", "Out for delivery", …) still open the right tab.
    const deepLinkRegex = /^purchases:\/\/([^\/]+)(?:\/(.+))?$/
    const match = typeof href === "string" ? href.match(deepLinkRegex) : null

    console.log("[NotificationsScreen] Deep link match:", match)

    if (match && match[1]) {
      onNavigateToPurchases?.(match[1], match[2] || orderId)
      return
    }

    const status = getNotificationStatus(item)
    if (status) {
      console.log("[NotificationsScreen] Navigating via status:", status)
      onNavigateToPurchases?.(status, orderId)
    }
  }

  // Normalize a raw status token to a PurchasesScreen tab key.
  const mapStatusToken = (raw: string): string => {
    const s = raw.trim().toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_")
    if (s === "out_for_delivery") return "to_receive"
    if (s === "to_ship") return "shipped"
    return s
  }

  // Pretty-print the payment method shown in a notification's meta row.
  const formatPaymentMethod = (pm?: string): string => {
    if (!pm) return ""
    const p = String(pm).toLowerCase()
    if (p === "gcash") return "GCash"
    if (p === "grabpay" || p === "grab_pay") return "GrabPay"
    if (p === "paymaya" || p === "maya") return "Maya"
    if (p === "card") return "Card"
    if (p === "cod") return "Cash on Delivery"
    return pm.charAt(0).toUpperCase() + pm.slice(1)
  }

  const getNotificationStatus = (item: any): string | null => {
    // 1) Explicit status field.
    const rawStatus = item?.status || item?.order_status
    if (typeof rawStatus === "string" && rawStatus.trim()) {
      return mapStatusToken(rawStatus)
    }
    // 2) Deep link: purchases://status[/order-id].
    if (typeof item?.href === "string") {
      const match = item.href.match(/^purchases:\/\/([^\/]+)(?:\/(.+))?$/)
      if (match?.[1]) return mapStatusToken(match[1])
    }
    // 3) Keyword scan of the title/message — but only for order-related
    // notifications (has order_id or mentions an order/shipment), so promo
    // notifications don't get a bogus status badge / redirect.
    const text =
      `${item?.title ?? ""} ${item?.message ?? ""} ${item?.body ?? ""} ${item?.description ?? ""}`.toLowerCase()
    const isOrderNotif =
      !!item?.order_id ||
      /order|purchase|delivery|shipment|parcel|package/.test(text)
    if (isOrderNotif) {
      if (text.includes("out for delivery")) return "to_receive"
      if (text.includes("delivered")) return "delivered"
      if (text.includes("to receive")) return "to_receive"
      if (
        text.includes("to ship") ||
        text.includes("shipped") ||
        text.includes("shipping")
      )
        return "shipped"
      if (text.includes("processing")) return "processing"
      if (text.includes("cancel")) return "cancelled"
      if (text.includes("return") || text.includes("refund")) return "return"
      if (text.includes("paid") || text.includes("payment confirmed"))
        return "paid"
      if (text.includes("pending") || text.includes("awaiting payment"))
        return "pending"
    }
    return null
  }

  const getStatusBadgeConfig = (status: string | null, dark: boolean) => {
    const normalized = (status || "").replace(/[_-]/g, " ").trim().toLowerCase()
    switch (normalized) {
      case "pending":
        return {
          label: "Pending",
          bg: dark ? "#3f2f0a" : "#fef3c7",
          text: dark ? "#fcd34d" : "#92400e",
        }
      case "paid":
        return {
          label: "Paid",
          bg: dark ? "#0f3b2e" : "#dcfce7",
          text: dark ? "#86efac" : "#166534",
        }
      case "processing":
        return {
          label: "Processing",
          bg: dark ? "#0f2a4d" : "#dbeafe",
          text: dark ? "#93c5fd" : "#1e40af",
        }
      case "to ship":
      case "toship":
      case "shipped":
        return {
          label: "To Ship",
          bg: dark ? "#3a1f45" : "#f3e8ff",
          text: dark ? "#d8b4fe" : "#6b21a8",
        }
      case "to receive":
      case "toreceive":
      case "out for delivery":
        return {
          label: "To Receive",
          bg: dark ? "#123348" : "#cffafe",
          text: dark ? "#67e8f9" : "#0e7490",
        }
      case "delivered":
        return {
          label: "Delivered",
          bg: dark ? "#1f3f21" : "#d1fae5",
          text: dark ? "#6ee7b7" : "#065f46",
        }
      case "cancelled":
        return {
          label: "Cancelled",
          bg: dark ? "#3f1f1f" : "#fee2e2",
          text: dark ? "#fca5a5" : "#991b1b",
        }
      default:
        return null
    }
  }

  const totalNotifications = notifications?.unread_count || 0

  return (
    <View style={styles.root}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.titleSection,
            {
              backgroundColor: colors.containerBg,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 14,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              Notifications
            </Text>
            {totalNotifications > 0 && (
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{totalNotifications}</Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.filterBar,
            {
              backgroundColor: colors.containerBg,
              borderTopColor: colors.border,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            scrollEventThrottle={16}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === "all" && [
                  styles.filterButtonActive,
                  { backgroundColor: Colors.sky },
                ],
              ]}
              onPress={() => setFilterType("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "all" && {
                    color: Colors.white,
                    fontWeight: "700",
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === "unread" && [
                  styles.filterButtonActive,
                  { backgroundColor: Colors.sky },
                ],
              ]}
              onPress={() => setFilterType("unread")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "unread" && {
                    color: Colors.white,
                    fontWeight: "700",
                  },
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === "read" && [
                  styles.filterButtonActive,
                  { backgroundColor: Colors.sky },
                ],
              ]}
              onPress={() => setFilterType("read")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "read" && {
                    color: Colors.white,
                    fontWeight: "700",
                  },
                ]}
              >
                Read
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.emptyIcon} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.sky}
              />
            }
          >
            {notifications?.notifications &&
            notifications.notifications.length > 0 ? (
              (() => {
                const filtered = getFilteredNotifications()
                return filtered.length > 0 ? (
                  filtered.map((item: any) => {
                    const isExpanded = expandedNotificationId === item.id
                    const isLoadingUpdates = loadingUpdates[item.id]
                    const isUnread = !item.is_read

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.notificationCard,
                          {
                            backgroundColor: isUnread
                              ? colors.unreadBg
                              : colors.containerBg,
                            borderColor: isUnread
                              ? Colors.sky + "55"
                              : colors.border,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={[styles.notificationItem]}
                          onPress={() => handleNotificationPress(item)}
                          activeOpacity={0.7}
                        >
                          {item.product_image ? (
                            <View
                              style={[
                                styles.notificationImageBox,
                                { backgroundColor: colors.borderLight },
                              ]}
                            >
                              <Image
                                source={{ uri: item.product_image }}
                                style={styles.notificationImage}
                                contentFit="contain"
                                transition={200}
                              />
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.notificationIconBox,
                                {
                                  backgroundColor: getSeverityColor(
                                    item.severity
                                  ),
                                },
                              ]}
                            >
                              <Ionicons
                                name={getSeverityIcon(item.severity)}
                                size={24}
                                color={Colors.white}
                              />
                            </View>
                          )}
                          <View style={styles.notificationContent}>
                            <View style={styles.notificationHeaderRow}>
                              <Text
                                style={[
                                  styles.notificationTitle,
                                  { color: colors.text },
                                ]}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              <Text
                                style={[
                                  styles.notificationTime,
                                  { color: colors.textSec },
                                ]}
                              >
                                {formatDate(item.created_at)}
                              </Text>
                            </View>
                            {(() => {
                              const badge = getStatusBadgeConfig(
                                getNotificationStatus(item),
                                isDarkMode
                              )
                              if (!badge) return null
                              return (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    { backgroundColor: badge.bg },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusBadgeText,
                                      { color: badge.text },
                                    ]}
                                  >
                                    {badge.label}
                                  </Text>
                                </View>
                              )
                            })()}
                            <Text
                              style={[
                                styles.notificationDescription,
                                { color: colors.textSec },
                              ]}
                              numberOfLines={2}
                            >
                              {item.message}
                            </Text>
                            {/* Meta footer: amount · qty · payment + view-order
                                affordance (the card deep-links to MyPurchases) */}
                            {(item.amount > 0 ||
                              item.quantity > 0 ||
                              item.payment_method) && (
                              <View style={styles.notificationFooter}>
                                <View style={styles.notificationMetaLeft}>
                                  {item.amount > 0 && (
                                    <Text
                                      style={[
                                        styles.notificationAmountStrong,
                                        { color: colors.text },
                                      ]}
                                    >
                                      ₱
                                      {Number(item.amount).toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </Text>
                                  )}
                                  {item.quantity > 0 && (
                                    <Text
                                      style={[
                                        styles.notificationMetaText,
                                        { color: colors.textSec },
                                      ]}
                                    >
                                      {"   ·   "}Qty {item.quantity}
                                    </Text>
                                  )}
                                  {!!item.payment_method && (
                                    <Text
                                      style={[
                                        styles.notificationMetaText,
                                        { color: colors.textSec },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {"   ·   "}
                                      {formatPaymentMethod(item.payment_method)}
                                    </Text>
                                  )}
                                </View>
                                {(!!item.href || !!getNotificationStatus(item)) && (
                                  <View style={styles.viewOrderLink}>
                                    <Text style={styles.viewOrderText}>
                                      View order
                                    </Text>
                                    <Ionicons
                                      name="chevron-forward"
                                      size={13}
                                      color={Colors.sky}
                                    />
                                  </View>
                                )}
                              </View>
                            )}
                            {(item.updates || []).length > 0 && (
                              <TouchableOpacity
                                style={[
                                  styles.updatesToggle,
                                  { borderTopColor: colors.border },
                                ]}
                                onPress={() =>
                                  toggleNotificationExpand(item.id)
                                }
                              >
                                <Text
                                  style={[
                                    styles.updatesToggleText,
                                    { color: Colors.sky },
                                  ]}
                                >
                                  View {(item.updates || []).length} update
                                  {(item.updates || []).length !== 1
                                    ? "s"
                                    : ""}{" "}
                                  {isExpanded ? "▼" : "▶"}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View
                            style={[
                              styles.updatesContainer,
                              {
                                backgroundColor: colors.bg,
                                borderTopColor: colors.border,
                              },
                            ]}
                          >
                            {isLoadingUpdates ? (
                              <View style={styles.updatesLoading}>
                                <ActivityIndicator
                                  size="small"
                                  color={Colors.sky}
                                />
                              </View>
                            ) : (
                              (item.updates || []).map(
                                (update: any, updateIndex: number) => (
                                  <View
                                    key={`${item.id}-update-${updateIndex}`}
                                    style={[
                                      styles.updateItem,
                                      {
                                        borderLeftColor: Colors.sky,
                                        borderBottomColor: colors.border,
                                      },
                                      updateIndex ===
                                        (item.updates || []).length - 1 &&
                                        styles.updateItemLast,
                                    ]}
                                  >
                                    <View style={styles.updateTimelineIcon}>
                                      <View
                                        style={[
                                          styles.updateDot,
                                          { backgroundColor: Colors.sky },
                                        ]}
                                      />
                                    </View>
                                    <View style={styles.updateContent}>
                                      <View style={styles.updateHeaderRow}>
                                        <Text
                                          style={[
                                            styles.updateTitle,
                                            { color: colors.text },
                                          ]}
                                        >
                                          {update.title}
                                        </Text>
                                        <Text
                                          style={[
                                            styles.updateTime,
                                            { color: colors.textSec },
                                          ]}
                                        >
                                          {formatDate(
                                            update.event_date ||
                                              update.created_at
                                          )}
                                        </Text>
                                      </View>
                                      <Text
                                        style={[
                                          styles.updateMessage,
                                          { color: colors.textSec },
                                        ]}
                                      >
                                        {update.message}
                                      </Text>
                                    </View>
                                  </View>
                                )
                              )
                            )}
                          </View>
                        )}
                      </View>
                    )
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={64}
                      color={colors.emptyIcon}
                    />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      All caught up!
                    </Text>
                    <Text
                      style={[
                        styles.emptyDescription,
                        { color: colors.textSec },
                      ]}
                    >
                      You have no new notifications
                    </Text>
                  </View>
                )
              })()
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={64}
                  color={colors.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  All caught up!
                </Text>
                <Text
                  style={[styles.emptyDescription, { color: colors.textSec }]}
                >
                  You have no new notifications
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}
