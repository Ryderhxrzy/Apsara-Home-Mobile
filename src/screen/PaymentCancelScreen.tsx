import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { LinearGradient } from "expo-linear-gradient"
import styles from "../styles/PaymentCancelScreen.styles"

interface PaymentCancelScreenProps {
  isDarkMode?: boolean
  onRetry?: () => void
  onClose?: () => void
}

export default function PaymentCancelScreen({
  isDarkMode = false,
  onRetry,
  onClose,
}: PaymentCancelScreenProps) {
  const colors = {
    bg: isDarkMode ? "#0f172a" : "#fef2f2",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(239,68,68,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(239,68,68,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradientBg]}
      >
        <View style={styles.content}>
          <View
            style={[styles.iconContainer, { backgroundColor: "#ef444420" }]}
          >
            <Ionicons name="close-circle" size={80} color="#ef4444" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Payment Cancelled
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSec }]}>
            Your payment was not completed. Your order is still pending payment.
          </Text>

          <View
            style={[styles.infoBox, { backgroundColor: colors.containerBg }]}
          >
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Payment not received
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={Colors.sky} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                You have 24 hours to complete payment
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh-outline" size={16} color={Colors.sky} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Try payment again anytime
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.sky }]}
              onPress={onRetry}
            >
              <Ionicons name="repeat" size={16} color={Colors.white} />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.textSec },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Back to Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}
