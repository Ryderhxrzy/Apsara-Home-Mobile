import React, { useEffect } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Image,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import styles from "../styles/ReferralScreen.styles"

interface ReferralScreenProps {
  referrerUsername: string
  referrerName?: string
  referrerAvatarUrl?: string
  isDarkMode?: boolean
  onClose: () => void
  onRegister: () => void
}

export default function ReferralScreen({
  referrerUsername,
  referrerName,
  referrerAvatarUrl,
  isDarkMode = false,
  onClose,
  onRegister,
}: ReferralScreenProps) {
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [onClose])

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons
              name="close"
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
              AF Home
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#9ca3af" : Colors.textSecondary },
              ]}
            >
              Through referral
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Welcome Banner */}
        <LinearGradient
          colors={[Colors.sky, Colors.skyDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="gift" size={48} color={Colors.white} />
            <Text style={styles.bannerTitle}>You're Invited!</Text>
            <Text style={styles.bannerSubtitle}>
              Join through a special referral link
            </Text>
          </View>
        </LinearGradient>

        {/* Referrer Info Card */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>
            Referred by
          </Text>
          <View style={styles.referrerInfo}>
            {referrerAvatarUrl ? (
              <Image
                source={{ uri: referrerAvatarUrl }}
                style={styles.referrerAvatar}
              />
            ) : (
              <View style={styles.referrerAvatar}>
                <Text style={styles.avatarText}>
                  {referrerName?.charAt(0).toUpperCase() ||
                    referrerUsername.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.referrerDetails}>
              <Text
                style={[
                  styles.referrerName,
                  isDarkMode && styles.referrerNameDark,
                ]}
              >
                {referrerName || referrerUsername}
              </Text>
              <Text
                style={[
                  styles.referrerUsername,
                  isDarkMode && styles.referrerUsernameDark,
                ]}
              >
                @{referrerUsername}
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text
            style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}
          >
            Benefits
          </Text>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="star" size={20} color={Colors.sky} />
            </View>
            <View style={styles.benefitText}>
              <Text
                style={[
                  styles.benefitTitle,
                  isDarkMode && styles.benefitTitleDark,
                ]}
              >
                Exclusive Rewards
              </Text>
              <Text
                style={[
                  styles.benefitDesc,
                  isDarkMode && styles.benefitDescDark,
                ]}
              >
                Earn rewards and commissions from your purchases
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="people" size={20} color={Colors.sky} />
            </View>
            <View style={styles.benefitText}>
              <Text
                style={[
                  styles.benefitTitle,
                  isDarkMode && styles.benefitTitleDark,
                ]}
              >
                Build Your Network
              </Text>
              <Text
                style={[
                  styles.benefitDesc,
                  isDarkMode && styles.benefitDescDark,
                ]}
              >
                Grow your affiliate network and earn commission
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="pricetag" size={20} color={Colors.sky} />
            </View>
            <View style={styles.benefitText}>
              <Text
                style={[
                  styles.benefitTitle,
                  isDarkMode && styles.benefitTitleDark,
                ]}
              >
                Special Offers
              </Text>
              <Text
                style={[
                  styles.benefitDesc,
                  isDarkMode && styles.benefitDescDark,
                ]}
              >
                Access exclusive deals and promotions
              </Text>
            </View>
          </View>
        </View>

        {/* AF Home & Referral Info Section */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text
            style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}
          >
            AF Home & Referral
          </Text>

          {/* Referrer Info */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Ionicons
                name="person"
                size={20}
                color={Colors.sky}
                style={styles.statusIcon}
              />
              <View style={styles.statusContent}>
                <Text
                  style={[
                    styles.statusLabel,
                    isDarkMode && styles.statusLabelDark,
                  ]}
                >
                  Referred by
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    isDarkMode && styles.statusValueDark,
                  ]}
                >
                  {referrerName || referrerUsername}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
            AF Home is your trusted marketplace for quality products with
            exclusive rewards and affiliate opportunities.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, isDarkMode && styles.footerDark]}>
        <View style={styles.footerContent}>
          <TouchableOpacity style={styles.primaryButton} onPress={onRegister}>
            <Text style={styles.primaryButtonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isDarkMode && styles.secondaryButtonDark,
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                isDarkMode && styles.secondaryButtonTextDark,
              ]}
            >
              Already Referred by Other User
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
