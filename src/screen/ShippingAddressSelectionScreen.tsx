import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import AddAddressScreen from "./AddAddressScreen"
import styles from "../styles/ShippingAddressSelectionScreen.styles"

interface UserAddress {
  id: number
  full_name: string
  phone: string
  address: string
  region: string
  province: string
  city: string
  barangay: string
  zip_code: string
  address_type: string
  notes?: string
  is_default: boolean
  full_address: string
}

interface ShippingAddressSelectionScreenProps {
  addresses: UserAddress[]
  selectedAddress: UserAddress | null
  isDarkMode?: boolean
  onBack?: () => void
  onSelectAddress?: (address: UserAddress) => void
}

export default function ShippingAddressSelectionScreen({
  addresses,
  selectedAddress,
  isDarkMode = false,
  onBack,
  onSelectAddress,
}: ShippingAddressSelectionScreenProps) {
  const insets = useSafeAreaInsets()
  const [showAddAddress, setShowAddAddress] = useState(false)

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showAddAddress) {
          setShowAddAddress(false)
          return true
        }
        onBack?.()
        return true
      }
    )

    return () => backHandler.remove()
  }, [onBack, showAddAddress])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(59,130,246,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={isDarkMode ? "#e5e7eb" : Colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.headerGreeting,
                { color: isDarkMode ? "#f8fafc" : Colors.text },
              ]}
            >
              Select Address
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#9ca3af" : Colors.textSecondary },
              ]}
            >
              Choose shipping destination
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddAddress(true)}
            style={styles.addBtn}
          >
            <Ionicons name="add-circle" size={24} color={Colors.sky} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Address List */}
      <ScrollView
        style={[styles.content, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="location-outline"
              size={64}
              color={colors.textSec}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Addresses
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>
              You don't have any saved addresses yet
            </Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[
                styles.addressCard,
                {
                  backgroundColor:
                    selectedAddress?.id === addr.id
                      ? `${Colors.sky}15`
                      : colors.containerBg,
                  borderColor:
                    selectedAddress?.id === addr.id
                      ? Colors.sky
                      : colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => {
                onSelectAddress?.(addr)
                onBack?.()
              }}
              activeOpacity={0.7}
            >
              <View style={styles.addressCardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressType, { color: Colors.forest }]}>
                    {addr.address_type}
                  </Text>
                  <Text
                    style={[styles.addressName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {addr.full_name}{" "}
                    <Text
                      style={[styles.addressPhone, { color: colors.textSec }]}
                    >
                      ({addr.phone})
                    </Text>
                  </Text>
                  <Text
                    style={[styles.addressText, { color: colors.textSec }]}
                    numberOfLines={3}
                  >
                    {addr.full_address}
                  </Text>
                  {addr.notes && (
                    <Text
                      style={[styles.addressNotes, { color: colors.textSec }]}
                    >
                      Notes: {addr.notes}
                    </Text>
                  )}
                </View>
                {selectedAddress?.id === addr.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.sky}
                    style={styles.checkmark}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {showAddAddress && (
        <View style={StyleSheet.absoluteFill}>
          <AddAddressScreen
            isDarkMode={isDarkMode}
            onBack={() => setShowAddAddress(false)}
            onAddressAdded={() => {
              setShowAddAddress(false)
              // Parent component will handle refreshing the address list
            }}
          />
        </View>
      )}
    </View>
  )
}
