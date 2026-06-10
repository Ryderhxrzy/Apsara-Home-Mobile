import React, { useEffect } from "react"
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Animated,
  Linking,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import styles from "../styles/OurBranchesScreen.styles"

interface OurBranchesScreenProps {
  onBack: () => void
  isDarkMode: boolean
}

interface Branch {
  type: string
  name: string
  address: string
  lat?: number
  lng?: number
}

const branches: Branch[] = [
  {
    type: "HEAD OFFICE",
    name: "AF Home Head Office, Meycuayan, Bulacan",
    address: "50 altoveros St., Corner Bagbaguin Road, Meycauayan, Bulacan",
  },
  {
    type: "SM STORE",
    name: "AF Home SM City North Edsa, Quezon City",
    address:
      "Interior Zone, SM City North EDSA, Bagong Pag-asa, Quezon City, Metro Manila",
  },
  {
    type: "FACTORY OUTLET",
    name: "AF Home Factory Outlet, San Pedro, Laguna",
    address:
      "KM 29 MMG Fojas Compound Brgy. San Antonio, San Pedro, Philippines",
  },
  {
    type: "SM STORE",
    name: "AF Home Store, SM Dasmarinas",
    address:
      "KM 29 MMG Fojas Compound Brgy. San Antonio, San Pedro, Philippines",
  },
  {
    type: "BRANCH",
    name: "AF Home La Loma, Quezon City",
    address: "88 Calavite St. Paang Bundok La Loma Quezon City, Philippines",
  },
]

export default function OurBranchesScreen({
  onBack,
  isDarkMode,
}: OurBranchesScreenProps) {
  const insets = useSafeAreaInsets()
  const slideAnim = useState(() => new Animated.Value(100))[0]

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
  }

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack])

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.google.com/maps?q=${encodedAddress}`
    Linking.openURL(url).catch(() => {
      // Fallback if Google Maps app is not installed
      Linking.openURL(`https://www.google.com/maps/search/${encodedAddress}`)
    })
  }

  const openWaze = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    const wazeUrl = `waze://?q=${encodedAddress}`
    Linking.openURL(wazeUrl).catch(() => {
      // Fallback to web version if Waze app is not installed
      Linking.openURL(`https://waze.com/ul?q=${encodedAddress}`)
    })
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 100],
              }),
            },
          ],
        },
      ]}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bg }]}
        edges={[]}
      >
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
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? "#f8fafc" : Colors.text}
              />
            </TouchableOpacity>
            <Text
              style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
            >
              Our Branches
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={[styles.scroll, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Tagline */}
          <View
            style={[
              styles.taglineContainer,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.tagline, { color: colors.text }]}>
              Our Branches
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSec }]}>
              Find the nearest AF Home branch and open directions instantly
              using Google Maps or Waze.
            </Text>
          </View>

          {/* Branch Cards */}
          {branches.map((branch, index) => (
            <View
              key={index}
              style={[
                styles.branchCard,
                {
                  backgroundColor: colors.containerBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.branchHeader}>
                <Text style={[styles.branchType, { color: Colors.sky }]}>
                  {branch.type}
                </Text>
              </View>
              <Text style={[styles.branchName, { color: colors.text }]}>
                {branch.name}
              </Text>
              <Text style={[styles.branchAddress, { color: colors.textSec }]}>
                {branch.address}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.mapButton, { borderColor: Colors.sky }]}
                  onPress={() => openGoogleMaps(branch.address)}
                >
                  <Ionicons name="logo-google" size={16} color={Colors.sky} />
                  <Text style={[styles.mapButtonText, { color: Colors.sky }]}>
                    Google Maps
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapButton, { backgroundColor: Colors.sky }]}
                  onPress={() => openWaze(branch.address)}
                >
                  <Text style={styles.wazeButtonText}>Waze</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  )
}
