import React, { useEffect, useMemo, useRef, useState } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  BackHandler,
  Animated,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { API_CONFIG } from "../config/api"
import { useAppContext } from "../context/AppContext"
import styles from "../styles/LeaderboardScreen.styles"

interface LeaderboardEntry {
  id: number
  name: string
  username: string
  avatar: string
  referrals: number
  rank?: number
}

const MEDAL_COLORS: Record<number, string> = {
  1: "#F59E0B",
  2: "#94A3B8",
  3: "#C08457",
}

const getMedalIcon = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null

const getTierLabel = (rank: number) => {
  if (rank === 1) return "Gold"
  if (rank === 2) return "Silver"
  if (rank === 3) return "Bronze"
  if (rank <= 10) return "Elite"
  if (rank <= 20) return "Rising"
  return "Member"
}

export default function LeaderboardScreen({
  isDarkMode = false,
  onClose,
}: {
  isDarkMode?: boolean
  onClose?: () => void
}) {
  const insets = useSafeAreaInsets()
  const { enrichedUser } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [showCurrentUserIndicator, setShowCurrentUserIndicator] = useState(true)
  const glow = useRef(new Animated.Value(0)).current
  const bob = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current
  const scrollViewRef = useRef<ScrollView>(null)

  const colors = {
    bg: isDarkMode ? "#0a0e27" : "#0ea5e9",
    headerStart: "#0066FF",
    headerEnd: "#00D4FF",
    cardAlt: isDarkMode ? "#0c1728" : "#f8fbff",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#23324a" : "#dbe7f3",
    accent: Colors.sky,
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose?.()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onClose])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [bob, glow])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/public/top-members?sort=referrals&per_page=20`
      )
      const result = await response.json()
      const formattedData = Array.isArray(result?.data)
        ? result.data.map((member: any, index: number) => ({
            id: member.id,
            name: member.name,
            username: member.username,
            avatar: member.avatar,
            referrals: Number(member.referrals) || 0,
            rank: member.rank || index + 1,
          }))
        : []
      setLeaderboardData(formattedData)

      if (enrichedUser) {
        const userRankIndex = formattedData.findIndex(
          (entry) => entry.id === parseInt(enrichedUser.id)
        )
        if (userRankIndex !== -1) {
          setCurrentUserRank(userRankIndex + 1)
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchLeaderboard()
  }

  const handleScroll = (event: any) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y
    // If user has scrolled past the "You" indicator, hide it
    // The indicator should disappear when user scrolls to see their actual ranking
    if (currentUserRank && currentUserRank > 3) {
      // Approximate position where current user row would appear
      // Adjust threshold based on your layout
      const threshold = 300
      if (contentOffsetY > threshold) {
        setShowCurrentUserIndicator(false)
      } else {
        setShowCurrentUserIndicator(true)
      }
    }
  }

  const derivedLeaderboard = useMemo(
    () => [...leaderboardData],
    [leaderboardData]
  )
  const topThree = derivedLeaderboard.slice(0, 3)
  const restRankings = derivedLeaderboard.slice(3)

  const renderTopCard = (
    entry: LeaderboardEntry,
    position: "first" | "second" | "third",
    rank: number
  ) => {
    const avatarSize = position === "first" ? 120 : 100
    const scale = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.03],
    })
    const translateY = bob.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -4],
    })
    const avatarTheme =
      position === "first"
        ? {
            border: "#D4AF37",
            inner: "#FFF7D6",
            text: "#8A6500",
            ring: ["#FFD700", "#D4AF37"] as [string, string],
          }
        : position === "second"
          ? {
              border: "#E0E0E0",
              inner: "#E8F4FF",
              text: "#1E40AF",
              ring: ["#E0F2FE", "#C0C0C0"] as [string, string],
            }
          : {
              border: "#CD7F32",
              inner: "#FFE8D6",
              text: "#6B3E0E",
              ring: ["#FF9A56", "#CD7F32"] as [string, string],
            }
    const initials = entry.name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")

    const getRankBadgeColor = () => {
      if (position === "first") return "#FFD700"
      if (position === "second") return "#C0C0C0"
      return "#CD7F32"
    }

    return (
      <Animated.View
        key={entry.id}
        style={[
          styles.topCardWrapper,
          {
            marginTop: position === "first" ? -50 : 0,
            marginLeft: position === "first" ? 8 : 0,
            marginRight: position === "first" ? 8 : 0,
            transform: [
              { translateY },
              {
                scale:
                  position === "first"
                    ? Animated.multiply(scale, pulse)
                    : scale,
              },
            ],
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          {position === "first" && (
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
          )}
          <View style={{ position: "relative" }}>
            <View
              style={[
                styles.topCardAvatarOuter,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  borderColor: avatarTheme.border,
                },
              ]}
            >
              {entry.avatar ? (
                <View
                  style={[
                    styles.topCardAvatarImageWrap,
                    { borderColor: avatarTheme.border },
                  ]}
                >
                  <Image
                    source={{ uri: entry.avatar }}
                    style={styles.topCardAvatarImage}
                  />
                </View>
              ) : (
                <View style={styles.topCardInitialCircle}>
                  <LinearGradient
                    colors={avatarTheme.ring}
                    style={styles.topCardInitialRing}
                  >
                    <View
                      style={[
                        styles.topCardInitialInner,
                        {
                          backgroundColor: avatarTheme.inner,
                          borderColor: avatarTheme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.topCardInitial,
                          {
                            color: avatarTheme.text,
                            fontSize: position === "first" ? 32 : 26,
                          },
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
            <View
              style={[
                styles.rankBadge,
                { backgroundColor: getRankBadgeColor() },
              ]}
            >
              <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
          </View>
        </View>

        <Text
          style={[styles.topCardName, { color: Colors.white }]}
          numberOfLines={2}
        >
          {entry.name}
        </Text>

        <View style={styles.topCardBadge}>
          <Ionicons name="people" size={13} color="#ffffff" />
          <Text style={styles.topCardBadgeText}>{entry.referrals} refs</Text>
        </View>
      </Animated.View>
    )
  }

  const renderLeaderboardRow = (entry: LeaderboardEntry, rank: number) => {
    const initials = entry.name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")

    return (
      <View
        key={entry.id}
        style={[styles.rankingItem, { borderBottomColor: colors.border }]}
      >
        <View style={styles.rankingItemLeft}>
          <View
            style={[
              styles.rankingBadge,
              { borderColor: MEDAL_COLORS[rank] || colors.border },
            ]}
          >
            <View style={styles.rankingBadgeInner}>
              <Text
                style={[
                  styles.rankingBadgeText,
                  { color: rank <= 3 ? Colors.white : "#0369A1" },
                ]}
              >
                {getMedalIcon(rank) || `${rank}`}
              </Text>
            </View>
          </View>
          {entry.avatar ? (
            <View
              style={[
                styles.rankingAvatar,
                styles.rankingAvatarFallback,
                {
                  borderColor: MEDAL_COLORS[rank] || colors.border,
                  backgroundColor: colors.cardAlt,
                },
              ]}
            >
              <View
                style={[
                  styles.rankingAvatarImageWrap,
                  { borderColor: "rgba(255,255,255,0.18)" },
                ]}
              >
                <Image
                  source={{ uri: entry.avatar }}
                  style={styles.rankingAvatarImage}
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.rankingAvatar,
                styles.rankingAvatarFallback,
                {
                  backgroundColor: colors.cardAlt,
                  borderColor: MEDAL_COLORS[rank] || colors.border,
                },
              ]}
            >
              <LinearGradient
                colors={
                  rank <= 3
                    ? ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.08)"]
                    : ["#E0F2FE", "#BAE6FD"]
                }
                style={styles.rankingAvatarFallbackInner}
              >
                <Text
                  style={[
                    styles.rankingAvatarEmoji,
                    { color: rank <= 3 ? Colors.white : "#0369A1" },
                  ]}
                >
                  {initials}
                </Text>
              </LinearGradient>
            </View>
          )}
          <View style={styles.rankingInfo}>
            <Text
              style={[styles.rankingName, { color: colors.text }]}
              numberOfLines={1}
            >
              {entry.username}
            </Text>
            <Text style={[styles.rankingEarnings, { color: colors.textSec }]}>
              {entry.referrals} referrals
            </Text>
          </View>
        </View>
        <View style={styles.rankingMeta}>
          <Text style={[styles.rankingTrend, { color: colors.textSec }]}>
            Member
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.headerStart }]}
        edges={[]}
      >
        <LinearGradient
          colors={["#0066FF", "#00D4FF", "#0066FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        >
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          <View style={styles.headerDecor3} />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={styles.menuBtn} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.headerStart }]}
      edges={[]}
    >
      <LinearGradient
        colors={["#0066FF", "#00D4FF", "#0066FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBackground}
      >
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerDecor3} />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <View style={styles.menuBtn} />
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {topThree.length > 0 && (
          <LinearGradient
            colors={["#0066FF", "#00D4FF", "#0066FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.topThreeContainer, styles.topThreeOverlap]}
          >
            <View style={styles.topThreeGrid}>
              {topThree[1] && renderTopCard(topThree[1], "second", 2)}
              {topThree[0] && renderTopCard(topThree[0], "first", 1)}
              {topThree[2] && renderTopCard(topThree[2], "third", 3)}
            </View>
          </LinearGradient>
        )}

        {restRankings.length > 0 && (
          <View
            style={[
              styles.rankingsSection,
              {
                backgroundColor: isDarkMode ? "#0f1b31" : "#f4f8fc",
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Leaderboard
              </Text>
            </View>
            {restRankings.map((entry, idx) => {
              const isCurrentUser =
                enrichedUser && entry.id === parseInt(enrichedUser.id)
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.rankingItem,
                    isCurrentUser && styles.currentUserHighlight,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.rankingItemLeft}>
                    <View
                      style={[
                        styles.rankingBadge,
                        { borderColor: MEDAL_COLORS[idx + 4] || colors.border },
                      ]}
                    >
                      <View style={styles.rankingBadgeInner}>
                        <Text
                          style={[
                            styles.rankingBadgeText,
                            { color: "#0369A1" },
                          ]}
                        >
                          {`${idx + 4}`}
                        </Text>
                      </View>
                    </View>
                    {entry.avatar ? (
                      <View
                        style={[
                          styles.rankingAvatar,
                          styles.rankingAvatarFallback,
                          {
                            borderColor: MEDAL_COLORS[idx + 4] || colors.border,
                            backgroundColor: colors.cardAlt,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.rankingAvatarImageWrap,
                            { borderColor: "rgba(255,255,255,0.18)" },
                          ]}
                        >
                          <Image
                            source={{ uri: entry.avatar }}
                            style={styles.rankingAvatarImage}
                          />
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.rankingAvatar,
                          styles.rankingAvatarFallback,
                          {
                            backgroundColor: colors.cardAlt,
                            borderColor: MEDAL_COLORS[idx + 4] || colors.border,
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={["#E0F2FE", "#BAE6FD"]}
                          style={styles.rankingAvatarFallbackInner}
                        >
                          <Text
                            style={[
                              styles.rankingAvatarEmoji,
                              { color: "#0369A1" },
                            ]}
                          >
                            {entry.name
                              .split(" ")
                              .slice(0, 2)
                              .map((word) => word.charAt(0).toUpperCase())
                              .join("")}
                          </Text>
                        </LinearGradient>
                      </View>
                    )}
                    <View style={styles.rankingInfo}>
                      <Text
                        style={[styles.rankingName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {entry.name}
                        {isCurrentUser && " (You)"}
                      </Text>
                      <Text
                        style={[
                          styles.rankingEarnings,
                          { color: colors.textSec },
                        ]}
                      >
                        {entry.referrals} referrals
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rankingMeta}>
                    <Text
                      style={[styles.rankingTrend, { color: colors.textSec }]}
                    >
                      Member
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {currentUserRank &&
        currentUserRank > 3 &&
        enrichedUser &&
        showCurrentUserIndicator && (
          <TouchableOpacity
            style={styles.floatingUserIndicator}
            activeOpacity={0.8}
          >
            <View style={styles.floatingAvatarSection}>
              <View style={styles.floatingUserAvatar}>
                {enrichedUser.avatar_url ? (
                  <Image
                    source={{ uri: enrichedUser.avatar_url }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text style={styles.floatingUserInitial}>
                    {enrichedUser.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w.charAt(0).toUpperCase())
                      .join("")}
                  </Text>
                )}
              </View>
              <View style={styles.floatingUserText}>
                <Text style={styles.floatingUserName} numberOfLines={1}>
                  {enrichedUser.name}
                </Text>
                <Text style={styles.floatingUserRank}>#{currentUserRank}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={16} color="#0066FF" />
          </TouchableOpacity>
        )}
    </SafeAreaView>
  )
}
