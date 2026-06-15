import React, { useEffect, useState } from "react"
import {  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Alert,
  ActivityIndicator,
  Animated,
  FlatList,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { useLoginHistory } from "../hooks/query/useLoginHistory"
import styles from "../styles/HistoryScreen.styles"

interface HistoryScreenProps {
  onBack: () => void
  isDarkMode: boolean
  token?: string | null
}

interface LoginHistoryItem {
  id: number
  description: string
  method: string
  method_icon: string
  device: string
  platform: string
  browser: string
  ip_address: string
  location?: string
  created_at: string
  timestamp: number
}

export default function HistoryScreen({
  onBack,
  isDarkMode,
  token,
}: HistoryScreenProps) {
  const insets = useSafeAreaInsets()
  const slideAnim = useState(() => new Animated.Value(100))[0]

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useLoginHistory({ token })

  // Flatten paginated pages into a single list (preserves order)
  const history: LoginHistoryItem[] =
    data?.pages.flatMap((page) => page.items) ?? []

  // Footer/initial loading spinner; refreshing drives pull-to-refresh
  const loading = isLoading || isFetchingNextPage
  const refreshing = isRefetching
  const hasMore = hasNextPage

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    cardBg: isDarkMode ? "#1e293b" : "#f8fafc",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
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

  useEffect(() => {
    if (error) {
      console.error("[HistoryScreen] Error fetching login history:", error)
      Alert.alert("Error", "Failed to load login history")
    }
  }, [error])

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const isToday = date.toDateString() === today.toDateString()
      const isYesterday = date.toDateString() === yesterday.toDateString()

      if (isToday) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      } else if (isYesterday) {
        return `Yesterday ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
      } else {
        return (
          date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year:
              date.getFullYear() !== today.getFullYear()
                ? "numeric"
                : undefined,
          }) +
          " " +
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        )
      }
    } catch {
      return "Unknown date"
    }
  }

  const getMethodColor = (method: string): string => {
    const methodColors: { [key: string]: string } = {
      email: "#3b82f6",
      biometric: "#8b5cf6",
      google: "#ef4444",
      qr: "#06b6d4",
      facebook: "#1e40af",
    }
    return methodColors[method] || "#6b7280"
  }

  const renderHistoryItem = ({ item }: { item: LoginHistoryItem }) => (
    <View
      style={[
        styles.historyItem,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.historyItemLeft}>
        <View
          style={[
            styles.methodIcon,
            {
              backgroundColor: getMethodColor(item.method) + "20",
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>{item.method_icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.historyMethod, { color: colors.text }]}>
            {item.description}
          </Text>
          <View style={styles.historyDetails}>
            <Text style={[styles.detailText, { color: colors.textSec }]}>
              <Ionicons
                name="phone-portrait"
                size={12}
                color={colors.textSec}
              />{" "}
              {item.device}
            </Text>
            <Text style={[styles.separator, { color: colors.border }]}>•</Text>
            <Text style={[styles.detailText, { color: colors.textSec }]}>
              <Ionicons name="globe" size={12} color={colors.textSec} />{" "}
              {item.ip_address}
            </Text>
          </View>
          <Text style={[styles.historyTime, { color: colors.textSec }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={48} color={colors.textSec} />
      <Text style={[styles.emptyText, { color: colors.text, marginTop: 12 }]}>
        No login history yet
      </Text>
      <Text
        style={[styles.emptySubText, { color: colors.textSec, marginTop: 4 }]}
      >
        Your login attempts will appear here
      </Text>
    </View>
  )

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
                name="chevron-back-outline"
                size={24}
                color={isDarkMode ? "#e5e7eb" : Colors.text}
              />
            </TouchableOpacity>
            <Text
              style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
            >
              Login History
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={[styles.list, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.sky} />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (hasMore && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={() => refetch()}
          scrollEnabled={true}
        />
      </SafeAreaView>
    </Animated.View>
  )
}
