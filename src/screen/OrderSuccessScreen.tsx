// @ts-nocheck
import React, { useState } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Image,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { API_CONFIG } from "../config/api"
import Toast from "react-native-toast-message"
import styles from "../styles/OrderSuccessScreen.styles"

interface OrderData {
  item?: {
    product_id: number
    product_name: string
    product_image: string
    product_price_member: number
    product_price_srp?: number
    brand_name?: string
    quantity: number
    variant_color?: string
    variant_size?: string
    variant_image?: string
  }
  items?: Array<{
    product_id: number
    product_name: string
    product_image: string
    product_price_member: number
    product_price_srp?: number
    brand_name?: string
    quantity: number
    variant_color?: string
    variant_size?: string
    variant_image?: string
  }>
  user: {
    name: string
    phone?: string
    email?: string
    referrer_username?: string
  }
  selectedAddress: {
    full_name: string
    phone: string
    full_address: string
  }
  selectedPaymentMethod: string
  shippingCost: number
  voucherDiscount: number
  selectedVoucher: number | null
  subtotal: number
  shopDiscount: number
  total: number
  token?: string
  checkoutUrl?: string
  orderId?: number
  checkoutId?: string
  mobileOrderId?: string
  paymentIntentId?: string
}

interface OrderSuccessScreenProps {
  orderData: OrderData
  onBack?: () => void
  onNavigateToPayment?: (checkoutUrl: string) => void
  onPayLater?: () => void
  isDarkMode?: boolean
}

export default function OrderSuccessScreen({
  orderData,
  onBack,
  onNavigateToPayment,
  onPayLater,
  isDarkMode = false,
}: OrderSuccessScreenProps) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)

  const renderInfoRow = (
    label: string,
    value: string | number,
    icon?: string
  ) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons name={icon as any} size={16} color={Colors.sky} />
          </View>
        )}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )

  const handlePayment = async () => {
    console.log("[OrderSuccessScreen] Proceed to payment clicked")

    if (!orderData.token) {
      console.log("[OrderSuccessScreen] Missing authentication token")
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Authentication token missing",
      })
      return
    }

    console.log("[OrderSuccessScreen] Token found, setting loading to true")
    setLoading(true)

    try {
      console.log("[OrderSuccessScreen] Using checkout URL from orderData")

      if (orderData.checkoutUrl) {
        // Wait a moment to let user see the loading state
        await new Promise((resolve) => setTimeout(resolve, 500))

        Toast.show({
          type: "success",
          text1: "Redirecting to Payment",
          text2: "Opening PayMongo checkout...",
        })

        console.log(
          "[OrderSuccessScreen] Navigating to payment with checkout URL"
        )
        onNavigateToPayment?.(orderData.checkoutUrl)
      } else {
        console.log("[OrderSuccessScreen] No checkout URL in orderData")
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Checkout URL not available",
        })
        setLoading(false)
      }
    } catch (error: any) {
      console.error("[OrderSuccessScreen] Error:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to proceed to payment",
      })
      setLoading(false)
    } finally {
      console.log("[OrderSuccessScreen] Setting loading to false")
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack?.()
        return true
      }
    )

    return () => backHandler.remove()
  }, [onBack])

  return (
    <View style={[styles.container, { backgroundColor: Colors.white }]}>
      {/* Header with Background Image */}
      <View style={styles.headerBackground}>
        <Image
          source={require("../../assets/purchases_bg.png")}
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View
          style={[
            styles.headerContent,
            { paddingTop: insets.top, paddingRight: 12 },
          ]}
        >
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: Colors.white }]}>
              Order Summary
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Section */}
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={56}
                color={Colors.forest}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.nameText}>Order Confirmed!</Text>
              <Text style={styles.usernameText}>
                Order #{orderData.mobileOrderId || orderData.orderId || "N/A"}
              </Text>
              <Text style={styles.statusText}>
                Review your order details and proceed to payment.
              </Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        {renderSection(
          `Products (${orderData.items?.length || 1})`,
          <>
            {orderData.item && !orderData.items && (
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {orderData.item?.product_name}
                  </Text>
                  {(orderData.item?.variant_color ||
                    orderData.item?.variant_size) && (
                    <Text style={styles.productVariant}>
                      {orderData.item?.variant_color &&
                        `${orderData.item.variant_color}`}
                      {orderData.item?.variant_color &&
                      orderData.item?.variant_size
                        ? ", "
                        : ""}
                      {orderData.item?.variant_size &&
                        `${orderData.item.variant_size}`}
                    </Text>
                  )}
                </View>
                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>
                    ₱
                    {(
                      orderData.item?.product_price_member || 0
                    ).toLocaleString()}
                  </Text>
                  <Text style={styles.productQty}>
                    x{orderData.item?.quantity}
                  </Text>
                </View>
              </View>
            )}

            {orderData.items && orderData.items.length > 0 && (
              <View style={{ gap: 12 }}>
                {orderData.items.map((item, index) => (
                  <View key={index} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item?.product_name || "Unknown Product"}
                      </Text>
                      {(item?.variant_color || item?.variant_size) && (
                        <Text style={styles.productVariant}>
                          {item?.variant_color && `${item.variant_color}`}
                          {item?.variant_color && item?.variant_size
                            ? ", "
                            : ""}
                          {item?.variant_size && `${item.variant_size}`}
                        </Text>
                      )}
                    </View>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPrice}>
                        ₱{(item?.product_price_member || 0).toLocaleString()}
                      </Text>
                      <Text style={styles.productQty}>x{item?.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Delivery Address Section */}
        {renderSection(
          "Delivery Address",
          <>
            {renderInfoRow(
              "Name",
              orderData.selectedAddress.full_name,
              "person"
            )}
            {renderInfoRow("Phone", orderData.selectedAddress.phone, "call")}
            {renderInfoRow(
              "Address",
              orderData.selectedAddress.full_address,
              "location"
            )}
          </>
        )}

        {/* Payment Method Section */}
        {renderSection(
          "Payment Method",
          renderInfoRow(
            "Method",
            orderData.selectedPaymentMethod.toUpperCase(),
            "card"
          )
        )}

        {/* Order Summary Section */}
        {renderSection(
          "Order Summary",
          <>
            {renderInfoRow(
              "Subtotal",
              `₱${orderData.subtotal.toLocaleString()}`
            )}
            {orderData.shopDiscount > 0 &&
              renderInfoRow(
                "Member Discount",
                `-₱${orderData.shopDiscount.toLocaleString()}`
              )}
            {orderData.voucherDiscount > 0 &&
              renderInfoRow(
                "Voucher Discount",
                `-₱${orderData.voucherDiscount.toLocaleString()}`
              )}
            {orderData.shippingCost > 0 &&
              renderInfoRow(
                "Shipping",
                `₱${orderData.shippingCost.toLocaleString()}`
              )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalPrice}>
                ₱{orderData.total.toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.6 }]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="card" size={18} color={Colors.white} />
              <Text style={styles.payBtnText}>Proceed to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sky} />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        </View>
      )}
    </View>
  )
}
