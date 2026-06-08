// @ts-nocheck
import React, { useEffect, useState } from "react"
import {  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  BackHandler,
  Modal,
  Pressable,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { Image } from "react-native"
import styles from "../styles/SettingsScreen.styles"

interface User {
  name?: string
  avatar_url?: string
  email?: string
}

interface SettingsScreenProps {
  user?: User | null
  onBack: () => void
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  onNavigateSecurity: () => void
  onEditProfile?: () => void
  onNavigateAboutUs?: () => void
  onNavigatePrivacyPolicy?: () => void
  onNavigateTermsAndConditions?: () => void
  onNavigateIncomeDisclaimer?: () => void
  onNavigateCookiePolicy?: () => void
  onNavigateRewardsAndCommissions?: () => void
  onNavigateContactUs?: () => void
  onNavigateOurBranches?: () => void
  onNavigateFAQs?: () => void
  onNavigateShippingInfo?: () => void
  onNavigateReturns?: () => void
  onLogout?: () => void
}

export default function SettingsScreen({
  user,
  onBack,
  isDarkMode,
  setIsDarkMode,
  onNavigateSecurity,
  onEditProfile,
  onNavigateAboutUs,
  onNavigatePrivacyPolicy,
  onNavigateTermsAndConditions,
  onNavigateIncomeDisclaimer,
  onNavigateCookiePolicy,
  onNavigateRewardsAndCommissions,
  onNavigateContactUs,
  onNavigateOurBranches,
  onNavigateFAQs,
  onNavigateShippingInfo,
  onNavigateReturns,
  onLogout,
}: SettingsScreenProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const insets = useSafeAreaInsets()

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    cardBg: isDarkMode ? "#1e293b" : "#f8fafc",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bg }]}
        edges={[]}
      >
        <View
          style={[
            styles.headerBackground,
            { borderBottomColor: colors.border },
          ]}
        >
          <Image
            source={require("../../assets/settings_bg.png")}
            style={styles.headerBackgroundImage}
            resizeMode="cover"
          />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back-outline"
                size={20}
                color={Colors.white}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: Colors.white }]}>
              Settings
            </Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={[styles.scroll, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                {user?.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.profileAvatarPlaceholder,
                      { backgroundColor: colors.cardBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileAvatarInitial,
                        { color: Colors.sky },
                      ]}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.profileName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {user?.name || "User"}
                </Text>
                <Text
                  style={[styles.profileEmail, { color: colors.textSec }]}
                  numberOfLines={1}
                >
                  {user?.email || "No email"}
                </Text>
              </View>
              {onEditProfile && (
                <TouchableOpacity
                  onPress={onEditProfile}
                  style={styles.editButton}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDarkMode ? "#64748b" : "#94a3b8"}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.profileDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.profileActions}>
              {onLogout && (
                <TouchableOpacity
                  style={styles.profileActionButton}
                  onPress={() => setShowLogoutConfirm(true)}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={Colors.error}
                  />
                  <Text
                    style={[styles.profileActionText, { color: Colors.error }]}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.profileActionButton}>
                <Ionicons name="add-outline" size={18} color={Colors.sky} />
                <Text style={[styles.profileActionText, { color: Colors.sky }]}>
                  Add Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Appearance Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionTitle,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.sectionTitleText, { color: colors.textSec }]}
              >
                APPEARANCE
              </Text>
            </View>
            <View
              style={[
                styles.settingRow,
                styles.settingRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
            >
              <View
                style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="moon-outline" size={20} color={Colors.sky} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.borderLight, true: Colors.sky }}
                thumbColor="#fff"
              />
            </View>
            <TouchableOpacity style={[styles.settingRow]}>
              <View
                style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="globe-outline" size={20} color={Colors.sky} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Language
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={[styles.languageValue, { color: colors.textSec }]}>
                  English
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkMode ? "#64748b" : "#94a3b8"}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionTitle,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.sectionTitleText, { color: colors.textSec }]}
              >
                ACCOUNT
              </Text>
            </View>
            {onEditProfile && (
              <TouchableOpacity
                style={[
                  styles.settingRow,
                  styles.settingRowWithBorder,
                  { borderBottomColor: colors.border },
                ]}
                onPress={onEditProfile}
              >
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: colors.cardBg },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.sky}
                  />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Profile
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkMode ? "#64748b" : "#94a3b8"}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.settingRow,
                styles.settingRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateSecurity}
            >
              <View
                style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={Colors.sky}
                />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Security
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow]}>
              <View
                style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="people-outline" size={20} color={Colors.sky} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Community
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
          </View>

          {/* Information Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionTitle,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.sectionTitleText, { color: colors.textSec }]}
              >
                INFORMATION
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateAboutUs}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                About us
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigatePrivacyPolicy}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Privacy Policy
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateTermsAndConditions}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Terms and Conditions
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateIncomeDisclaimer}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Income Disclaimer
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateCookiePolicy}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Cookie Policy
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkRow]}
              onPress={onNavigateRewardsAndCommissions}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Rewards and Commissions
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionTitle,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.sectionTitleText, { color: colors.textSec }]}
              >
                SUPPORT
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateContactUs}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Contact Us
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateOurBranches}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Our Branches
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateFAQs}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                FAQs
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.linkRow,
                styles.linkRowWithBorder,
                { borderBottomColor: colors.border },
              ]}
              onPress={onNavigateShippingInfo}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Shipping Info
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkRow]}
              onPress={onNavigateReturns}
            >
              <Text style={[styles.linkLabel, { color: Colors.sky }]}>
                Returns
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDarkMode ? "#64748b" : "#94a3b8"}
              />
            </TouchableOpacity>
          </View>

          {/* Payments Section */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionTitle,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text
                style={[styles.sectionTitleText, { color: colors.textSec }]}
              >
                PAYMENTS
              </Text>
            </View>
            <View style={styles.paymentContent}>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>
                We Accept:
              </Text>
              <Text style={[styles.paymentMethods, { color: colors.textSec }]}>
                Credit/Debit Cards • E-Wallets • Bank Transfers • GCash •
                PayMaya • and more
              </Text>
            </View>
          </View>

          {/* Version Footer */}
          <View style={styles.versionFooter}>
            <Text style={[styles.versionText, { color: colors.textSec }]}>
              AF Home v1.0.0
            </Text>
          </View>
        </ScrollView>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowLogoutConfirm(false)}
            activeOpacity={1}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.containerBg },
              ]}
            >
              <View
                style={[
                  styles.modalIconContainer,
                  { backgroundColor: isDarkMode ? "#7f1d1d" : "#fee2e2" },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={32}
                  color={Colors.error}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Logout
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSec }]}>
                Are you sure you want to logout from your account?
              </Text>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.logoutConfirmButton]}
                  onPress={() => {
                    setShowLogoutConfirm(false)
                    onLogout?.()
                  }}
                >
                  <Text style={styles.logoutConfirmText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  )
}
