import React, { useCallback, useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import Icon from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { getColors, radius } from "../theme/theme"
import {
  conversationService,
  formatManilaTime,
  type Conversation,
} from "../services/conversationService"
import ConversationThread from "./chat/ConversationThread"

const SUPPORT_AVATAR =
  "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/sir_mvm6cd.png"

interface ChatSupportScreenProps {
  isDarkMode?: boolean
  onBack: () => void
  token?: string | null
  user?: { id?: string | number; name?: string; avatar_url?: string } | null
}

/**
 * Conversations inbox — lists the customer's support threads (matches the web
 * panel). Tap a row to open its ConversationThread; "New chat" starts (or
 * reuses) a support thread. Shows last message, time, unread count, and a
 * "Closed" tag for resolved threads.
 */
export default function ChatSupportScreen({
  isDarkMode = false,
  onBack,
  token,
}: ChatSupportScreenProps) {
  const insets = useSafeAreaInsets()
  const t = getColors(isDarkMode)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errored, setErrored] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadList = useCallback(async () => {
    if (!token) {
      setErrored(true)
      setLoading(false)
      return
    }
    try {
      const { conversations: list } = await conversationService.listConversations(
        token
      )
      setConversations(list)
      setErrored(false)
    } catch {
      setErrored(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    loadList()
  }, [loadList])

  // Hardware back: close the active thread first, else close the overlay.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (active) {
        setActive(null)
        loadList()
        return true
      }
      onBack()
      return true
    })
    return () => sub.remove()
  }, [active, onBack, loadList])

  const startNewChat = async () => {
    if (!token || creating) return
    setCreating(true)
    try {
      const conv = await conversationService.startConversation(token)
      setActive(conv)
    } catch {
      Toast.show({
        type: "error",
        text1: "Couldn't start chat",
        text2: "Please try again.",
      })
    } finally {
      setCreating(false)
    }
  }

  // Active thread takes over the whole overlay.
  if (active && token) {
    return (
      <ConversationThread
        conversation={active}
        token={token}
        isDarkMode={isDarkMode}
        onBack={() => {
          setActive(null)
          loadList()
        }}
      />
    )
  }

  const renderRow = ({ item }: { item: Conversation }) => {
    const resolved = item.status === "resolved"
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: t.divider }]}
        onPress={() => setActive(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: SUPPORT_AVATAR }}
          style={styles.rowAvatar}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, { color: t.text }]} numberOfLines={1}>
              {item.subject || "Support"}
            </Text>
            <Text style={[styles.rowTime, { color: t.textMuted }]}>
              {formatManilaTime(item.last_message?.sent_at)}
            </Text>
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.rowPreview, { color: t.textSecondary }]}
              numberOfLines={1}
            >
              {item.last_message?.message || "No messages yet"}
            </Text>
            {resolved ? (
              <View style={[styles.closedTag, { backgroundColor: t.surface }]}>
                <Text style={[styles.closedTagText, { color: t.textMuted }]}>
                  Closed
                </Text>
              </View>
            ) : item.unread_count > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unread_count > 9 ? "9+" : item.unread_count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: t.bgSubtle }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: t.card,
            borderBottomColor: t.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: t.text }]}>Messages</Text>
          <Text style={[styles.headerSub, { color: t.textSecondary }]}>
            Chat with AF Home support
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={startNewChat}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="add" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      ) : errored ? (
        <View style={styles.center}>
          <Icon name="chatbubble-ellipses-outline" size={44} color={t.textMuted} />
          <Text style={[styles.stateText, { color: t.textSecondary }]}>
            Couldn't load your conversations.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadList}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Image
            source={{ uri: SUPPORT_AVATAR }}
            style={styles.emptyAvatar}
            contentFit="cover"
          />
          <Text style={[styles.emptyTitle, { color: t.text }]}>
            How can we help?
          </Text>
          <Text style={[styles.stateText, { color: t.textSecondary }]}>
            Start a conversation and our team will get back to you.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={startNewChat}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Start a conversation</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                loadList()
              }}
              colors={[Colors.sky]}
              tintColor={isDarkMode ? "#fff" : Colors.sky}
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { paddingVertical: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowAvatar: { width: 46, height: 46, borderRadius: 23 },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  rowTime: { fontSize: 11, fontWeight: "500" },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowPreview: { flex: 1, fontSize: 13 },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  closedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  closedTagText: { fontSize: 10, fontWeight: "700" },
  emptyAvatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  stateText: { fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 19 },
  primaryBtn: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: radius.full,
    minWidth: 180,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
})
