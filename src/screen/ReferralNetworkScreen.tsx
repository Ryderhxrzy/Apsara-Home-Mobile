// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import Toast from "react-native-toast-message"
import { Colors } from "../constants/colors"
import { ReferralTree, ReferralUser } from "../services/referralService"
import { useReferralNetwork } from "../hooks/query/useReferralNetwork"
import styles from "../styles/ReferralNetworkScreen.styles"

interface ReferralNetworkScreenProps {
  token?: string | null
  onBack?: () => void
  tree?: ReferralTree | null
  isDarkMode?: boolean
}

export default function ReferralNetworkScreen({
  token,
  onBack,
  tree: treeProp,
  isDarkMode = false,
}: ReferralNetworkScreenProps) {
  const insets = useSafeAreaInsets()

  // Fetch the referral tree via React Query. When a `tree` prop is supplied by
  // the parent (e.g. AppNavigator pre-fetched it), prefer that and skip the
  // network request.
  const {
    data: fetchedTree,
    isFetching,
    refetch,
    error,
  } = useReferralNetwork({
    token,
    enabled: !treeProp,
  })

  const tree: ReferralTree | null = treeProp ?? fetchedTree ?? null

  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          (error as any)?.message || "Failed to load referral network",
      })
    }
  }, [error])

  // Default-expand the root node. Derived from the tree instead of copying it
  // into state via an effect (avoids set-state-in-effect re-render loops).
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [expandedStats, setExpandedStats] = useState<Set<number>>(new Set())

  const rootId = tree?.root?.id

  const effectiveExpandedNodes = useMemo(() => {
    if (expandedNodes.size === 0 && rootId != null) {
      return new Set<number>([rootId])
    }
    return expandedNodes
  }, [expandedNodes, rootId])

  const handleBackPress = React.useCallback(() => {
    console.log("[ReferralNetworkScreen] handleBackPress called")
    if (onBack) {
      console.log("[ReferralNetworkScreen] calling onBack callback")
      onBack()
    } else {
      console.warn("[ReferralNetworkScreen] onBack callback is not defined!")
    }
  }, [onBack])

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      console.log("[ReferralNetworkScreen] Hardware back button pressed")
      handleBackPress()
      return true
    })

    return () => sub.remove()
  }, [handleBackPress])

  const toggleNode = (userId: number) => {
    const newExpanded = new Set(effectiveExpandedNodes)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedNodes(newExpanded)
  }

  const toggleStats = (userId: number) => {
    const newExpanded = new Set(expandedStats)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedStats(newExpanded)
  }

  const renderUserCard = (
    user: ReferralUser,
    level: number = 0,
    isLast: boolean = true
  ) => {
    const hasChildren = user.children && user.children.length > 0
    const isExpanded = effectiveExpandedNodes.has(user.id)
    const isRoot = level === 0
    const statsExpanded = isRoot || expandedStats.has(user.id)

    return (
      <View key={user.id}>
        <View style={{ flexDirection: "row", alignItems: "stretch" }}>
          {level > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: level * 16 - 8,
                marginRight: 12,
              }}
            >
              <View style={[styles.treeLine, { alignSelf: "stretch" }]} />
              <View style={styles.horizontalConnector} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.userCard, level === 0 && styles.rootCard]}
              onPress={hasChildren ? () => toggleNode(user.id) : undefined}
              activeOpacity={hasChildren ? 0.7 : 1}
            >
              <View style={styles.userCardContent}>
                <View style={styles.userCardHeader}>
                  <View style={styles.userAvatar}>
                    {user.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        style={styles.avatarImage}
                        transition={200}
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <View style={styles.badgesContainer}>
                        {isRoot && (
                          <View style={styles.rootBadge}>
                            <Ionicons
                              name="star"
                              size={10}
                              color={Colors.white}
                            />
                            <Text style={styles.rootBadgeText}>You</Text>
                          </View>
                        )}
                        {hasChildren && (
                          <View style={styles.expandIcon}>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={16}
                              color={Colors.sky}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.userUsername}>@{user.username}</Text>
                    <Text style={styles.joinDate}>
                      {new Date(user.joined_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {statsExpanded ? (
                  <View style={styles.userStats}>
                    <View style={styles.statItem}>
                      <View style={styles.statContent}>
                        <Ionicons name="people" size={13} color={Colors.sky} />
                        <Text style={styles.statValue}>
                          {user.children_count || 0}
                        </Text>
                      </View>
                      <Text style={styles.statLabel}>Direct</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={styles.statContent}>
                        <Ionicons name="cash" size={13} color="#10b981" />
                        <Text style={[styles.statValue, { color: "#10b981" }]}>
                          ₱{user.total_earnings}
                        </Text>
                      </View>
                      <Text style={styles.statLabel}>Earnings</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={styles.statContent}>
                        <Ionicons
                          name="trending-up"
                          size={13}
                          color="#f59e0b"
                        />
                        <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                          {user.total_pv}
                        </Text>
                      </View>
                      <Text style={styles.statLabel}>PV</Text>
                    </View>
                  </View>
                ) : !isRoot ? (
                  <TouchableOpacity
                    style={styles.statsPlaceholder}
                    onPress={() => toggleStats(user.id)}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.statsPlaceholderText}>
                      Tap to view stats
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableOpacity>

            {hasChildren && isExpanded && (
              <View style={styles.childrenContainer}>
                {user.children!.map((child, index) =>
                  renderUserCard(
                    child,
                    level + 1,
                    index === user.children!.length - 1
                  )
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  if (!tree) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <SafeAreaView
          style={[styles.root, { backgroundColor: colors.bg }]}
          edges={["left", "right", "bottom"]}
        >
          <View
            style={[
              styles.headerBackground,
              { borderBottomColor: colors.border },
            ]}
          >
            <Image
              source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969375/header_bg_jjpkvu.png"
            }}
              style={styles.headerBackgroundImage}
              contentFit="cover"
              transition={200}
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
                Referral Network
              </Text>
              <View style={{ width: 36 }} />
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.sky}
              style={{ marginBottom: 16 }}
            />
            <Ionicons
              name="people-outline"
              size={40}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Loading your network...</Text>
            <Text style={styles.emptyText}>
              Please wait while we fetch your referral data.
            </Text>
            <TouchableOpacity
              style={styles.emptyBackBtn}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Prepare root with children for rendering
  const rootWithChildren = tree.root.children
    ? tree.root
    : { ...tree.root, children: tree.children || [] }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.bg }]}
        edges={["left", "right", "bottom"]}
      >
        {/* Header with Background Image */}
        <View
          style={[
            styles.headerBackground,
            { borderBottomColor: colors.border },
          ]}
        >
          <Image
            source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969375/header_bg_jjpkvu.png"
            }}
            style={styles.headerBackgroundImage}
            contentFit="cover"
            transition={200}
          />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={handleBackPress}
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
              Referral Network
            </Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.sky}
              colors={[Colors.sky]}
            />
          }
        >
          {/* Summary Stats Section */}
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
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textSec }]}>
                Network Overview
              </Text>
            </View>
            <View style={styles.summaryContainer}>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor:
                      colors.containerBg === Colors.white
                        ? "#f8fafc"
                        : "#334155",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.summaryValue}>
                  {tree.summary?.total_network || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSec }]}>
                  Total Referrals
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor:
                      colors.containerBg === Colors.white
                        ? "#f8fafc"
                        : "#334155",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.summaryValue}>
                  {tree.summary?.direct_count || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSec }]}>
                  Direct
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor:
                      colors.containerBg === Colors.white
                        ? "#f8fafc"
                        : "#334155",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.summaryValue}>
                  ₱{tree.root?.total_earnings || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSec }]}>
                  Earned
                </Text>
              </View>
            </View>
          </View>

          {/* Referral Tree Section */}
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
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textSec }]}>
                Your Network
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              scrollEventThrottle={16}
              style={styles.treeScrollView}
            >
              <View style={styles.treeContainer}>
                {renderUserCard(rootWithChildren)}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
