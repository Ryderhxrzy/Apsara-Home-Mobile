import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { authService } from "../services/authService"
import { profileService } from "../services/profileService"
import { TIER_REQUIREMENTS } from "../constants/tierConfig"
import Toast from "react-native-toast-message"
import * as ImagePicker from "expo-image-picker"
import styles from "../styles/ProfileDetailsScreen.styles"

interface UserProfile {
  [key: string]: any
}

interface ProfileDetailsScreenProps {
  token?: string | null
  onClose?: () => void
  cartCount?: number
  onCartPress?: () => void
  onEditProfile?: (profileData: UserProfile) => void
  isDarkMode?: boolean
}

type IconName = keyof typeof Ionicons.glyphMap

type RowItem =
  | { kind: "info"; key: string; label: string; value: string; icon?: IconName }
  | {
      kind: "status"
      key: string
      label: string
      text: string
      color: string
      icon: IconName
    }
  | { kind: "node"; key: string; el: React.ReactNode }

const STATUS_GREEN = "#10b981"
const STATUS_RED = "#ef4444"

export default function ProfileDetailsScreen({
  token,
  onClose,
  cartCount = 0,
  onCartPress,
  onEditProfile,
  isDarkMode = false,
}: ProfileDetailsScreenProps) {
  const insets = useSafeAreaInsets()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const c = {
    bg: isDarkMode ? "#0b1220" : "#f0f9ff",
    card: isDarkMode ? "#1e293b" : Colors.white,
    cardAlt: isDarkMode ? "#0f172a" : "#f9fafb",
    border: isDarkMode ? "#334155" : "#e8eef4",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    iconBg: isDarkMode ? "#0c4a6e" : "#e0f2fe",
    chipNeutral: isDarkMode ? "#0f172a" : "#f1f5f9",
    track: isDarkMode ? "#334155" : "#e5e7eb",
  }
  const coverColors: [string, string] = isDarkMode
    ? ["#075985", "#0c4a6e"]
    : [Colors.sky, Colors.skyDark]

  const fetchUserProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      setUserProfile(await authService.getCurrentUser(token))
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load profile details",
      })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose?.()
      return true
    })
    return () => sub.remove()
  }, [onClose])

  const handleAvatarUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Please allow access to your photos",
        })
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result.canceled || !token) return

      setUploadingAvatar(true)
      const newAvatarUrl = await profileService.uploadAvatar(
        token,
        result.assets[0].uri
      )
      if (newAvatarUrl) {
        setUserProfile((prev) =>
          prev ? { ...prev, avatar_url: newAvatarUrl } : prev
        )
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Profile picture updated",
        })
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to upload avatar",
        })
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to upload avatar",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const statusColor = (status?: string | boolean) => {
    if (status === "verified" || status === "true" || status === true)
      return STATUS_GREEN
    if (status === "not_verified" || status === "false" || status === false)
      return STATUS_RED
    return Colors.sky
  }

  /* ---------- Grouped list helpers ---------- */
  const info = (
    key: string,
    label: string,
    value: any,
    icon?: IconName
  ): RowItem | null =>
    value === null || value === undefined || value === ""
      ? null
      : { kind: "info", key, label, value: String(value), icon }

  const RowView = ({ row, isLast }: { row: RowItem; isLast: boolean }) => {
    if (row.kind === "node") {
      return (
        <View
          style={
            isLast
              ? undefined
              : { borderBottomWidth: 1, borderBottomColor: c.border }
          }
        >
          {row.el}
        </View>
      )
    }
    return (
      <View
        style={[
          styles.row,
          isLast && styles.rowLast,
          { borderBottomColor: c.border },
        ]}
      >
        <View style={styles.rowLeft}>
          {row.icon ? (
            <View style={[styles.rowIcon, { backgroundColor: c.iconBg }]}>
              <Ionicons name={row.icon} size={15} color={Colors.sky} />
            </View>
          ) : null}
          <Text style={[styles.rowLabel, { color: c.textSec }]}>
            {row.label}
          </Text>
        </View>
        {row.kind === "status" ? (
          <View style={[styles.statusBadge, { backgroundColor: row.color }]}>
            <Text style={styles.statusBadgeText}>{row.text}</Text>
          </View>
        ) : (
          <Text style={[styles.rowValue, { color: c.text }]} numberOfLines={2}>
            {row.value}
          </Text>
        )}
      </View>
    )
  }

  const Section = ({ label, rows }: { label: string; rows: (RowItem | null)[] }) => {
    const visible = rows.filter((r): r is RowItem => r !== null)
    if (visible.length === 0) return null
    return (
      <View>
        <Text style={[styles.groupLabel, { color: c.textSec }]}>{label}</Text>
        <View
          style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}
        >
          {visible.map((row, i) => (
            <RowView key={row.key} row={row} isLast={i === visible.length - 1} />
          ))}
        </View>
      </View>
    )
  }

  /* ---------- Derived ---------- */
  const completion = Number(userProfile?.profile_completion_percentage)
  const hasCompletion =
    userProfile?.profile_completion_percentage !== undefined &&
    userProfile?.profile_completion_percentage !== null &&
    !Number.isNaN(completion)

  const isEmpty = (value: any) =>
    !value || value === "Not specified" || value === "0000"
  const hasNoAddress = userProfile
    ? isEmpty(userProfile.address) ||
      isEmpty(userProfile.city) ||
      isEmpty(userProfile.region) ||
      isEmpty(userProfile.province) ||
      isEmpty(userProfile.barangay) ||
      isEmpty(userProfile.zip_code)
    : false

  const ma = userProfile?.monthly_activation

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sky} />
          <Text style={[styles.loadingText, { color: c.textSec }]}>
            Loading profile...
          </Text>
        </View>
      ) : userProfile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          {/* Cover banner */}
          <LinearGradient
            colors={coverColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cover, { paddingTop: insets.top + 6 }]}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.topTitle}>Profile Details</Text>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                onPress={onCartPress}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={20} color={Colors.white} />
                {cartCount > 0 ? (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Floating profile sheet */}
          <View style={[styles.profileSheet, { backgroundColor: c.bg }]}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: c.iconBg, borderColor: c.bg }]}>
                {userProfile.avatar_url ? (
                  <Image
                    source={{ uri: userProfile.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {userProfile.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
                {uploadingAvatar ? (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.white} />
                  </View>
                ) : null}
              </View>
              <View style={styles.avatarEditIcon}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.nameText, { color: c.text }]} numberOfLines={1}>
              {userProfile.name}
            </Text>

            {userProfile.username ? (
              <Text style={styles.usernameText}>@{userProfile.username}</Text>
            ) : null}

            {userProfile.badge_image || userProfile.badge_name ? (
              <View style={styles.chipRow}>
                <View style={[styles.chip, styles.chipBadge]}>
                  {userProfile.badge_image ? (
                    <Image
                      source={{ uri: userProfile.badge_image }}
                      style={styles.chipImage}
                    />
                  ) : (
                    <Ionicons name="shield-checkmark" size={13} color={Colors.white} />
                  )}
                  <Text style={styles.chipText}>
                    {userProfile.badge_name || "Member"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Body */}
          <View style={[styles.body, { backgroundColor: c.bg }]}>
            {/* Stat tiles */}
            <View style={styles.statRow}>
              <View style={[styles.statTile, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.statIconWrap, { backgroundColor: c.iconBg }]}>
                  <Ionicons name="podium" size={16} color={Colors.sky} />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {userProfile.rank ? `#${userProfile.rank}` : "—"}
                </Text>
                <Text style={[styles.statLabel, { color: c.textSec }]}>Rank</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.statIconWrap, { backgroundColor: c.iconBg }]}>
                  <Ionicons name="pie-chart" size={16} color={Colors.sky} />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {hasCompletion ? `${completion}%` : "—"}
                </Text>
                <Text style={[styles.statLabel, { color: c.textSec }]}>Complete</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.statIconWrap, { backgroundColor: c.iconBg }]}>
                  <Ionicons name="ribbon" size={16} color={Colors.sky} />
                </View>
                <Text
                  style={[styles.statValue, { color: c.text, fontSize: 13 }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {userProfile.badge_name || "—"}
                </Text>
                <Text style={[styles.statLabel, { color: c.textSec }]}>Badge</Text>
              </View>
            </View>

            {/* Completion progress */}
            {hasCompletion ? (
              <View
                style={[
                  styles.group,
                  { backgroundColor: c.card, borderColor: c.border, padding: 14, marginBottom: 16 },
                ]}
              >
                <View style={styles.completion}>
                  <View style={styles.completionLabelRow}>
                    <Text style={[styles.completionLabel, { color: c.textSec }]}>
                      Profile completion
                    </Text>
                    <Text style={styles.completionPct}>{completion}%</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: c.track }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(Math.max(completion, 0), 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Edit / Complete CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, hasNoAddress && styles.ctaComplete]}
              onPress={() => onEditProfile?.(userProfile)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={hasNoAddress ? "checkmark-circle" : "pencil"}
                size={18}
                color={Colors.white}
              />
              <Text style={styles.ctaText}>
                {hasNoAddress ? "Complete Profile" : "Edit Profile"}
              </Text>
            </TouchableOpacity>

            <Section
              label="Personal"
              rows={[
                info("fn", "First Name", userProfile.first_name, "person"),
                info("ln", "Last Name", userProfile.last_name),
                info("mn", "Middle Name", userProfile.middle_name),
                info("em", "Email", userProfile.email, "mail"),
                info("ph", "Phone", userProfile.phone, "call"),
                info("bd", "Birth Date", userProfile.birth_date, "calendar"),
                info(
                  "gd",
                  "Gender",
                  userProfile.gender
                    ? userProfile.gender.charAt(0).toUpperCase() +
                        userProfile.gender.slice(1)
                    : null
                ),
                info("oc", "Occupation", userProfile.occupation),
                info("wl", "Work Location", userProfile.work_location?.toUpperCase()),
              ]}
            />

            <Section
              label="Address"
              rows={[
                info("ad", "Street Address", userProfile.address, "location"),
                info("bg", "Barangay", userProfile.barangay),
                info("ci", "City", userProfile.city),
                info("pr", "Province", userProfile.province),
                info("rg", "Region", userProfile.region),
                info("zp", "Zip Code", userProfile.zip_code),
                info("co", "Country", userProfile.country),
              ]}
            />

            <Section
              label="Account Status"
              rows={[
                {
                  kind: "status",
                  key: "ev",
                  label: "Email Verified",
                  text: userProfile.email_verified ? "Verified" : "Not Verified",
                  color: statusColor(userProfile.email_verified),
                  icon: "checkmark-circle",
                },
                userProfile.verification_status
                  ? {
                      kind: "status",
                      key: "vs",
                      label: "Verification",
                      text: String(userProfile.verification_status)
                        .replace("_", " ")
                        .toUpperCase(),
                      color: statusColor(userProfile.verification_status),
                      icon: "shield",
                    }
                  : null,
                info(
                  "as",
                  "Account Status",
                  userProfile.account_status === 0 ? "Active" : "Inactive"
                ),
                info(
                  "ls",
                  "Lock Status",
                  userProfile.lock_status === 0 ? "Unlocked" : "Locked"
                ),
                info(
                  "2fa",
                  "Two Factor Auth",
                  userProfile.two_factor_enabled ? "Enabled" : "Disabled"
                ),
              ]}
            />

            {ma ? (
              <Section
                label="Monthly Activation"
                rows={[
                  {
                    kind: "status",
                    key: "mas",
                    label: "Status",
                    text: String(ma.status || "").toUpperCase(),
                    color: ma.status === "active" ? STATUS_GREEN : STATUS_RED,
                    icon: "flash",
                  },
                  info("cpv", "Current PV", ma.current_month_pv, "trending-up"),
                  info("tpv", "Threshold PV", ma.threshold_pv),
                  info("rpv", "Remaining PV", ma.remaining_pv),
                  {
                    kind: "node",
                    key: "mapb",
                    el: (
                      <View style={styles.rowProgress}>
                        <View style={[styles.progressBar, { backgroundColor: c.track }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(
                                  ((ma.current_month_pv || 0) /
                                    (ma.threshold_pv || 1)) *
                                    100,
                                  100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressText, { color: c.textSec }]}>
                          {ma.current_month_pv} / {ma.threshold_pv} PV
                        </Text>
                      </View>
                    ),
                  },
                  info("dl", "Deadline", ma.month_label),
                ]}
              />
            ) : null}

            {userProfile.referrer_name ? (
              <Section
                label="Referral"
                rows={[
                  info("rn", "Referrer Name", userProfile.referrer_name, "person"),
                  info(
                    "ru",
                    "Referrer Username",
                    userProfile.referrer_username
                      ? `@${userProfile.referrer_username}`
                      : null
                  ),
                ]}
              />
            ) : null}

            {/* Badge journey */}
            <Text style={[styles.groupLabel, { color: c.textSec }]}>
              Badge Journey
            </Text>
            <View
              style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}
            >
              {Object.values(TIER_REQUIREMENTS).map((tier: any, i, arr) => {
                const isAchieved = Number(userProfile.rank || 0) >= tier.rank
                return (
                  <View
                    key={tier.rank}
                    style={[
                      styles.tierItem,
                      { borderBottomColor: c.border },
                      i === arr.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={[styles.tierRank, { backgroundColor: tier.color }]}>
                      <Text style={styles.tierRankText}>R{tier.rank}</Text>
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierTitle, { color: c.text }]}>
                        {tier.tier}
                      </Text>
                      <Text style={[styles.tierMeta, { color: c.textSec }]}>
                        PV: {tier.pv ?? "-"} | Referrals: {tier.referrals ?? "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tierState,
                        {
                          backgroundColor: isAchieved
                            ? isDarkMode
                              ? "#14532d"
                              : "#dcfce7"
                            : c.chipNeutral,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tierStateText,
                          {
                            color: isAchieved
                              ? isDarkMode
                                ? "#bbf7d0"
                                : "#166534"
                              : c.textSec,
                          },
                        ]}
                      >
                        {isAchieved ? "Achieved" : "Locked"}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={c.textSec} />
          <Text style={[styles.emptyText, { color: c.textSec }]}>
            Failed to load profile
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={Colors.white} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
