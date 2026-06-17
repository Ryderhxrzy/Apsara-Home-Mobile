import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import Toast from "react-native-toast-message"
import styles from "../styles/PaymentSuccessScreen.styles"

interface PaymentSuccessScreenProps {
  orderData?: {
    order_number: string
    transaction_id?: string
    amount: number
    payment_method: string
    product_name: string
    quantity: number
    customer_name: string
    customer_email?: string
    customer_phone?: string
    delivery_address?: string
    shipping_fee: number
    created_at?: string
  }
  onContinueShopping?: () => void
  onViewOrders?: () => void
  isDarkMode?: boolean
}

export default function PaymentSuccessScreen({
  orderData,
  onContinueShopping,
  onViewOrders,
  isDarkMode = false,
}: PaymentSuccessScreenProps) {
  const insets = useSafeAreaInsets()
  const [copyingRef, setCopyingRef] = useState<string | null>(null)

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : "#ffffff",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  const subtotal = orderData ? orderData.amount - orderData.shipping_fee : 0
  const formattedDate = orderData?.created_at
    ? new Date(orderData.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  const handleCopyToClipboard = (text: string, label: string) => {
    try {
      Toast.show({
        type: "success",
        text1: `${label} Copied`,
        text2: text,
      })
    } catch (error) {
      console.error("Copy error:", error)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Success Section */}
        <View
          style={[
            styles.successSection,
            {
              backgroundColor: colors.containerBg,
              marginTop: 16,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.successIconContainer,
              { backgroundColor: `${Colors.forest}15` },
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color={Colors.forest} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Order Confirmed
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSec }]}>
            Your payment has been processed successfully. Order confirmation has
            been sent to your email.
          </Text>
        </View>

        {orderData && (
          <>
            {/* Order Number & Reference */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.refBox,
                  {
                    backgroundColor: colors.borderLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.refRow}>
                  <View>
                    <Text style={[styles.refLabel, { color: colors.textSec }]}>
                      Order Number
                    </Text>
                    <Text style={[styles.refValue, { color: Colors.sky }]}>
                      #{orderData.order_number}
                    </Text>
                  </View>
                  <Ionicons name="copy" size={20} color={Colors.sky} />
                </View>

                {orderData.transaction_id && (
                  <>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <View style={styles.refRow}>
                      <View>
                        <Text
                          style={[styles.refLabel, { color: colors.textSec }]}
                        >
                          Transaction ID
                        </Text>
                        <Text style={[styles.refValue, { color: Colors.sky }]}>
                          {orderData.transaction_id}
                        </Text>
                      </View>
                      <Ionicons name="copy" size={20} color={Colors.sky} />
                    </View>
                  </>
                )}
              </View>

              <Text
                style={[
                  styles.dateText,
                  { color: colors.textSec, marginTop: 12 },
                ]}
              >
                Date: {formattedDate}
              </Text>
            </View>

            {/* Product Details */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Order Details
              </Text>

              <View
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colors.borderLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text
                      style={[styles.productName, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {orderData.product_name}
                    </Text>
                    <Text style={[styles.qtyText, { color: colors.textSec }]}>
                      Quantity: {orderData.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.productPrice, { color: Colors.sky }]}>
                    ₱{subtotal.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Address */}
            {orderData.delivery_address && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.containerBg,
                    marginTop: 12,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, marginBottom: 12 },
                  ]}
                >
                  Delivery Address
                </Text>

                <View
                  style={[
                    styles.addressCard,
                    {
                      backgroundColor: colors.borderLight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="location" size={16} color={Colors.sky} />
                  <Text
                    style={[
                      styles.addressText,
                      { color: colors.text, marginLeft: 8 },
                    ]}
                  >
                    {orderData.delivery_address}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Summary */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Payment Summary
              </Text>

              <View>
                <View
                  style={[
                    styles.summaryRow,
                    { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <Text
                    style={[styles.summaryLabel, { color: colors.textSec }]}
                  >
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ₱{subtotal.toLocaleString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryRow,
                    { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <Text
                    style={[styles.summaryLabel, { color: colors.textSec }]}
                  >
                    Shipping Fee
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ₱{orderData.shipping_fee.toLocaleString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryRow,
                    { borderBottomColor: colors.border, paddingVertical: 12 },
                  ]}
                >
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Total Amount Paid
                  </Text>
                  <Text style={[styles.totalValue, { color: Colors.sky }]}>
                    ₱{orderData.amount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textSec }]}
                  >
                    Payment Method
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {orderData.payment_method.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Customer Info */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Customer Information
              </Text>

              <View style={styles.customerInfoBox}>
                <View style={styles.customerInfoField}>
                  <Text
                    style={[
                      styles.customerInfoLabel,
                      { color: colors.textSec },
                    ]}
                  >
                    Full Name
                  </Text>
                  <View style={styles.customerInfoRow}>
                    <Ionicons name="person" size={16} color={Colors.sky} />
                    <Text
                      style={[
                        styles.customerInfoValue,
                        { color: colors.text, marginLeft: 8 },
                      ]}
                    >
                      {orderData.customer_name || "Not provided"}
                    </Text>
                  </View>
                </View>

                {orderData.customer_phone && (
                  <>
                    <View
                      style={[
                        styles.customerDivider,
                        { backgroundColor: colors.borderLight },
                      ]}
                    />
                    <View style={styles.customerInfoField}>
                      <Text
                        style={[
                          styles.customerInfoLabel,
                          { color: colors.textSec },
                        ]}
                      >
                        Phone Number
                      </Text>
                      <View style={styles.customerInfoRow}>
                        <Ionicons name="call" size={16} color={Colors.sky} />
                        <Text
                          style={[
                            styles.customerInfoValue,
                            { color: colors.text, marginLeft: 8 },
                          ]}
                        >
                          {orderData.customer_phone}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {orderData.customer_email && (
                  <>
                    <View
                      style={[
                        styles.customerDivider,
                        { backgroundColor: colors.borderLight },
                      ]}
                    />
                    <View style={styles.customerInfoField}>
                      <Text
                        style={[
                          styles.customerInfoLabel,
                          { color: colors.textSec },
                        ]}
                      >
                        Email Address
                      </Text>
                      <View style={styles.customerInfoRow}>
                        <Ionicons name="mail" size={16} color={Colors.sky} />
                        <Text
                          style={[
                            styles.customerInfoValue,
                            { color: colors.text, marginLeft: 8 },
                          ]}
                          numberOfLines={1}
                        >
                          {orderData.customer_email}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Info Box */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: `${Colors.sky}10`,
                    borderColor: Colors.sky,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.sky}
                />
                <Text
                  style={[
                    styles.infoBoxText,
                    { color: colors.text, marginLeft: 8 },
                  ]}
                >
                  Payment processed securely. Confirmation email sent.
                </Text>
              </View>
            </View>

            {/* Next Steps */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Next Steps
              </Text>

              <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: `${Colors.forest}20` },
                    ]}
                  >
                    <Ionicons name="mail" size={18} color={Colors.forest} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.timelineTitle, { color: colors.text }]}
                    >
                      Confirmation Sent
                    </Text>
                    <Text
                      style={[styles.timelineText, { color: colors.textSec }]}
                    >
                      Check your email for order details
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.timelineConnector,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: `${Colors.sky}20` },
                    ]}
                  >
                    <Ionicons name="time" size={18} color={Colors.sky} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.timelineTitle, { color: colors.text }]}
                    >
                      Order Processing
                    </Text>
                    <Text
                      style={[styles.timelineText, { color: colors.textSec }]}
                    >
                      We will begin processing your order
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.timelineConnector,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: `${Colors.sky}20` },
                    ]}
                  >
                    <Ionicons name="eye" size={18} color={Colors.sky} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.timelineTitle, { color: colors.text }]}
                    >
                      Track Status
                    </Text>
                    <Text
                      style={[styles.timelineText, { color: colors.textSec }]}
                    >
                      View Updates
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Order Support */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Order Support
              </Text>

              <View
                style={[
                  styles.faqBox,
                  { backgroundColor: colors.borderLight, marginTop: 0 },
                ]}
              >
                <Text style={[styles.faqTitle, { color: colors.text }]}>
                  Frequently Asked
                </Text>
                <View style={styles.faqList}>
                  <Text style={[styles.faqItem, { color: colors.textSec }]}>
                    • Track Order: Go to &quot;My Orders&quot; in the app for
                    real-time tracking information
                  </Text>
                  <Text style={[styles.faqItem, { color: colors.textSec }]}>
                    • Cancellation: Orders can be cancelled within 24 hours of
                    purchase from the app
                  </Text>
                  <Text style={[styles.faqItem, { color: colors.textSec }]}>
                    • Delivery: Typically 3-7 business days after shipment
                  </Text>
                  <Text style={[styles.faqItem, { color: colors.textSec }]}>
                    • Issues: For support, visit the app settings or contact us
                    through the Profile menu
                  </Text>
                </View>
              </View>
            </View>

            {/* Refund Policy */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: colors.containerBg,
                  marginTop: 12,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.policyBox,
                  {
                    backgroundColor: `${Colors.forest}10`,
                    borderColor: Colors.forest,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors.forest}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.policyTitle, { color: colors.text }]}>
                    Return & Refund Policy
                  </Text>
                  <Text style={[styles.policyText, { color: colors.textSec }]}>
                    Items can be returned within 30 days of purchase. Visit app
                    settings for full return policy details.
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {orderData && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.containerBg,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              console.log("[PaymentSuccessScreen] Continue Shopping pressed")
              onContinueShopping?.()
            }}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.sky} />
            <Text style={[styles.secondaryBtnText, { color: Colors.sky }]}>
              Continue Shopping
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.sky }]}
            onPress={() => {
              console.log("[PaymentSuccessScreen] View My Orders pressed")
              onViewOrders?.()
            }}
          >
            <Ionicons name="receipt" size={18} color={Colors.white} />
            <Text style={styles.primaryBtnText}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}
