import React from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { TIER_REQUIREMENTS, getTierColor } from "../constants/tierConfig"
import styles from "../styles/LevelProgressDetailsScreen.styles"

const BADGE_IMAGES: Record<number, any> = {
  1: {
    uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969106/homeStarter_s5bfjk.png"
  },
  2: {
    uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969102/homeBuilder_rylc2o.png"
  },
  3: {
    uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969111/homeStylist_hq5dbs.png"
  },
  4: {
    uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969112/lifestyleConsultant_k1mfyn.png"
  },
  5: {
    uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969112/lifestyleElite_nntnjj.png"
  },
}

interface LevelProgressDetailsScreenProps {
  currentRank: number
  personalPv: number
  referralCount: number
  activeMembers: number
  activeBuilders: number
  activeLeaders: number
  isDarkMode?: boolean
  onBack?: () => void
}

export default function LevelProgressDetailsScreen({
  currentRank,
  personalPv,
  referralCount,
  activeMembers,
  activeBuilders,
  activeLeaders,
  isDarkMode = false,
  onBack,
}: LevelProgressDetailsScreenProps) {
  const insets = useSafeAreaInsets()
  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
  }

  const getValue = (
    rank: number,
    key:
      | "pv"
      | "referrals"
      | "active_members"
      | "active_builders"
      | "active_leaders"
  ) => {
    if (rank !== currentRank) return null
    if (key === "pv") return personalPv
    if (key === "referrals") return referralCount
    if (key === "active_members") return activeMembers
    if (key === "active_builders") return activeBuilders
    return activeLeaders
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(59,130,246,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Level Progress Details
        </Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Object.values(TIER_REQUIREMENTS).map((tier) => {
          const achieved = currentRank >= tier.rank
          const tierColor = getTierColor(tier.tier)
          return (
            <View
              key={tier.rank}
              style={[
                styles.card,
                {
                  backgroundColor: colors.containerBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHead}>
                <View
                  style={[styles.rankBubble, { backgroundColor: tierColor }]}
                >
                  <Text style={styles.rankText}>R{tier.rank}</Text>
                </View>
                <Image
                  source={BADGE_IMAGES[tier.rank]}
                  style={styles.badgeImage}
                  contentFit="contain"
                  transition={200}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, { color: colors.text }]}>
                    {tier.tier}
                  </Text>
                  <Text
                    style={[
                      styles.state,
                      { color: achieved ? "#10b981" : colors.textSec },
                    ]}
                  >
                    {achieved ? "Achieved" : "Locked"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.req, { color: colors.textSec }]}>
                PV: {tier.pv ?? "-"}{" "}
                {tier.rank === currentRank
                  ? `(You: ${getValue(tier.rank, "pv")})`
                  : ""}
              </Text>
              <Text style={[styles.req, { color: colors.textSec }]}>
                Referrals: {tier.referrals ?? "-"}{" "}
                {tier.rank === currentRank
                  ? `(You: ${getValue(tier.rank, "referrals")})`
                  : ""}
              </Text>
              <Text style={[styles.req, { color: colors.textSec }]}>
                Active Members: {tier.active_members ?? "-"}
              </Text>
              <Text style={[styles.req, { color: colors.textSec }]}>
                Active Builders: {tier.active_builders ?? "-"}
              </Text>
              <Text style={[styles.req, { color: colors.textSec }]}>
                Active Leaders: {tier.active_leaders ?? "-"}
              </Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}
