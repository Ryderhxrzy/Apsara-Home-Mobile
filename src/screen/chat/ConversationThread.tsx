import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  BackHandler,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import Icon from "../../components/ui/Icon"
import { Colors } from "../../constants/colors"
import { getColors, radius } from "../../theme/theme"
import {
  conversationService,
  formatManilaTime,
  type ChatMessage,
  type Conversation,
  type ConversationOrder,
} from "../../services/conversationService"
import { pusherService } from "../../services/pusherService"

const SUPPORT_AVATAR =
  "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/sir_mvm6cd.png"

// "pending_approval" → "Pending Approval"
const formatStatusLabel = (s?: string | null) =>
  s ? s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : ""

const formatPHP = (n?: number | null) =>
  n == null
    ? null
    : "₱" +
      Number(n).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })

/**
 * Order context shown at the top of an order-scoped thread. Declared at module
 * scope (not inside the screen) so React Compiler can memoize it and it isn't
 * recreated each render. See docs/CHAT_MOBILE_API.md §2.4.
 */
function OrderContextCard({
  order,
  t,
}: {
  order: ConversationOrder
  t: ReturnType<typeof getColors>
}) {
  const amount = formatPHP(order.amount)
  const statuses = [
    order.payment_status,
    order.approval_status,
    order.fulfillment_status,
  ].filter(Boolean) as string[]
  return (
    <View
      style={[styles.orderCard, { backgroundColor: t.card, borderColor: t.border }]}
    >
      <View style={styles.orderHeadRow}>
        <Icon name="cube" size={15} color={Colors.sky} />
        <Text style={[styles.orderTitle, { color: t.text }]} numberOfLines={1}>
          {order.product_name || "Order"}
        </Text>
      </View>
      <View style={styles.orderMetaRow}>
        {amount && (
          <Text style={[styles.orderAmount, { color: t.text }]}>{amount}</Text>
        )}
        {order.quantity != null && (
          <Text style={[styles.orderMeta, { color: t.textSecondary }]}>
            {amount ? "  ·  " : ""}Qty {order.quantity}
          </Text>
        )}
        <Text
          style={[styles.orderRef, { color: t.textMuted }]}
          numberOfLines={1}
        >
          {"  ·  "}
          {order.reference}
        </Text>
      </View>
      {statuses.length > 0 && (
        <View style={styles.orderChips}>
          {statuses.map((s, i) => (
            <View
              key={i}
              style={[styles.orderChip, { backgroundColor: t.surface }]}
            >
              <Text style={[styles.orderChipText, { color: t.textSecondary }]}>
                {formatStatusLabel(s)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const POLL_MS = 5000

// Thread fetch size. Messages come back OLDEST-first and the API has no cursor
// paging (see docs/CHAT_MOBILE_API.md §3.4), so a page smaller than the thread
// would return the *oldest* N and DROP the newest — hiding recent messages on
// reload and stalling the poller (which keys off the last item). Fetch a
// generous page so the whole thread is present; support threads are far shorter.
const PAGE_SIZE = 200

// Keep the message list unique by id — realtime `message.sent` can echo a
// message we already have (our own send, or an overlapping poll).
const dedupeById = (list: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<number>()
  const out: ChatMessage[] = []
  for (const m of list) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    out.push(m)
  }
  return out
}
const upsertMessage = (list: ChatMessage[], msg: ChatMessage): ChatMessage[] =>
  list.some((m) => m.id === msg.id)
    ? list.map((m) => (m.id === msg.id ? msg : m))
    : [...list, msg]

interface ConversationThreadProps {
  conversation: Conversation
  token: string
  isDarkMode?: boolean
  /** Back to the conversations inbox. */
  onBack: () => void
}

/**
 * A single conversation's message thread. Realtime via the shared Pusher
 * connection (channel `private-conversation-{id}`), with 5s polling as a safety
 * net. Bubble side is decided purely by `sender_type` ("customer" = mine/right,
 * "admin" = left) — the backend computes it per-conversation and guarantees it's
 * collision-proof (docs/CHAT_MOBILE_API.md §2.1), so no id comparison is needed.
 */
export default function ConversationThread({
  conversation,
  token,
  isDarkMode = false,
  onBack,
}: ConversationThreadProps) {
  const insets = useSafeAreaInsets()
  const t = getColors(isDarkMode)
  const [conv, setConv] = useState<Conversation>(conversation)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [closing, setClosing] = useState(false)
  // Height of the on-screen keyboard. The chat renders inside a full-screen
  // absolute overlay, where the OS window-resize doesn't reliably lift the input
  // — so we track the keyboard ourselves and pad the bottom by its height.
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const scrollRef = useRef<ScrollView>(null)
  const lastIdRef = useRef(0)
  const sendingRef = useRef(false)
  const tempIdRef = useRef(-1)

  const convId = conversation.id
  const isResolved = conv.status === "resolved"

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack()
      return true
    })
    return () => sub.remove()
  }, [onBack])

  // Track the keyboard so the input bar stays just above it (the overlay breaks
  // the default window-resize lift). iOS fires the *Will* events (animated),
  // Android the *Did* events.
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"
    const onShow = (e: any) =>
      setKeyboardHeight(e?.endCoordinates?.height ?? 0)
    const onHide = () => setKeyboardHeight(0)
    const showSub = Keyboard.addListener(showEvt, onShow)
    const hideSub = Keyboard.addListener(hideEvt, onHide)
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Load messages for this thread.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { messages: msgs } = await conversationService.getMessages(
          token,
          convId,
          PAGE_SIZE
        )
        if (!active) return
        const unique = dedupeById(msgs)
        setMessages(unique)
        lastIdRef.current = unique.reduce((mx, m) => Math.max(mx, m.id), 0)
        conversationService.markRead(token, convId).catch(() => {})
      } catch {
        // surfaced via empty state
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [token, convId])

  // Poll (safety net).
  useEffect(() => {
    const id = setInterval(async () => {
      if (sendingRef.current) return
      try {
        const { messages: fresh } = await conversationService.getMessages(
          token,
          convId,
          PAGE_SIZE
        )
        // Derive newest from max(id) across the whole set (not the array tail) —
        // robust even if a future >PAGE_SIZE thread returns a truncated oldest
        // page (docs/CHAT_MOBILE_API.md §3.4).
        const newest = fresh.reduce<ChatMessage | null>(
          (a, b) => (a && a.id >= b.id ? a : b),
          null
        )
        const newestId = newest?.id ?? 0
        if (newestId !== lastIdRef.current) {
          lastIdRef.current = newestId
          setMessages(dedupeById(fresh))
          if (newest?.sender_type === "admin") {
            conversationService.markRead(token, convId).catch(() => {})
          }
        }
      } catch {
        // try again next tick
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [token, convId])

  // Realtime.
  useEffect(() => {
    const channelName = `private-conversation-${convId}`
    const onMessageSent = (payload: ChatMessage) => {
      if (!payload?.id) return
      setMessages((prev) => upsertMessage(prev, payload))
      lastIdRef.current = Math.max(lastIdRef.current, payload.id)
      if (payload.sender_type === "admin") {
        conversationService.markRead(token, convId).catch(() => {})
      }
    }
    const onConversationUpdated = () => {
      conversationService
        .markRead(token, convId)
        .then((c) => c && setConv(c))
        .catch(() => {})
    }
    // Read receipts: the agent read some of my messages — flip them to read so
    // the "Seen" indicator shows under the newest read one.
    const onMessagesRead = (payload: {
      message_ids?: number[]
      read_at?: string
    }) => {
      const ids = payload?.message_ids
      if (!ids?.length) return
      const readAt = payload.read_at ?? null
      setMessages((prev) =>
        prev.map((m) =>
          ids.includes(m.id) ? { ...m, is_read: true, read_at: readAt } : m
        )
      )
    }
    let channel: any = null
    try {
      channel = pusherService.subscribe(channelName)
      channel?.bind?.("message.sent", onMessageSent)
      channel?.bind?.("conversation.updated", onConversationUpdated)
      channel?.bind?.("messages.read", onMessagesRead)
    } catch {
      // polling keeps it fresh
    }
    return () => {
      try {
        channel?.unbind?.("message.sent", onMessageSent)
        channel?.unbind?.("conversation.updated", onConversationUpdated)
        channel?.unbind?.("messages.read", onMessagesRead)
        pusherService.unsubscribe(channelName)
      } catch {
        // ignore
      }
    }
  }, [token, convId])

  const scrollToEnd = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    )
  useEffect(() => {
    scrollToEnd()
  }, [messages, keyboardHeight])

  const send = async (preset?: string) => {
    const body = (preset ?? input).trim()
    if (!body || sending) return
    if (isResolved) {
      Toast.show({
        type: "info",
        text1: "Conversation closed",
        text2: "Reopen it to continue chatting.",
      })
      return
    }
    const tempId = tempIdRef.current--
    const temp: ChatMessage = {
      id: tempId,
      conversation_id: convId,
      sender_id: 0,
      sender_type: "customer",
      message: body,
      attachment_url: null,
      attachment_filename: null,
      is_read: false,
      read_at: null,
      created_at: "",
      updated_at: "",
    }
    setMessages((p) => [...p, temp])
    setInput("")
    setSending(true)
    sendingRef.current = true
    try {
      const saved = await conversationService.sendMessage(token, convId, body)
      setMessages((p) => upsertMessage(p.filter((m) => m.id !== tempId), saved))
      lastIdRef.current = Math.max(lastIdRef.current, saved.id)
    } catch (e: any) {
      setMessages((p) => p.filter((m) => m.id !== tempId))
      if (e?.response?.status === 422) {
        setConv((c) => ({ ...c, status: "resolved" }))
        Toast.show({
          type: "info",
          text1: "Conversation closed",
          text2: "Reopen it to continue chatting.",
        })
      } else {
        setInput(body)
        Toast.show({
          type: "error",
          text1: "Failed to send",
          text2: "Please check your connection and try again.",
        })
      }
    } finally {
      setSending(false)
      sendingRef.current = false
    }
  }

  const handleReopen = async () => {
    if (reopening) return
    setReopening(true)
    try {
      const c = await conversationService.reopen(token, convId)
      setConv(c)
    } catch {
      Toast.show({ type: "error", text1: "Couldn't reopen", text2: "Try again." })
    } finally {
      setReopening(false)
    }
  }

  const handleClose = () => {
    if (closing || isResolved) return
    Alert.alert(
      "Close conversation?",
      "You can reopen it anytime if you need more help.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: async () => {
            setClosing(true)
            try {
              const c = await conversationService.close(token, convId)
              setConv(c)
            } catch {
              Toast.show({
                type: "error",
                text1: "Couldn't close",
                text2: "Please try again.",
              })
            } finally {
              setClosing(false)
            }
          },
        },
      ]
    )
  }

  // Newest of MY messages the agent has read — gets a single "Seen" label.
  const lastReadMineId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.sender_type === "customer" && m.id > 0 && m.is_read) return m.id
    }
    return null
  })()

  const adminBubbleBg = isDarkMode ? "#1e293b" : "#ffffff"
  const agentName = conv.assigned_agent?.name
  const title = conv.subject || "AF Home Support"

  return (
    <View style={[styles.root, { backgroundColor: t.bgSubtle }]}>
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
        <View style={styles.headerAvatarWrap}>
          <Image
            source={{ uri: SUPPORT_AVATAR }}
            style={styles.headerAvatar}
            contentFit="cover"
            transition={150}
          />
          {!isResolved && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: t.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[styles.headerStatus, isResolved && { color: t.textMuted }]}
            numberOfLines={1}
          >
            {isResolved
              ? "Conversation closed"
              : agentName
                ? `Chatting with ${agentName}`
                : "Online • usually replies in a few minutes"}
          </Text>
        </View>
        {!isResolved && (
          <TouchableOpacity
            onPress={handleClose}
            disabled={closing}
            style={styles.headerAction}
            hitSlop={8}
          >
            {closing ? (
              <ActivityIndicator size="small" color={Colors.sky} />
            ) : (
              <Text style={styles.headerActionText}>Close</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {conv.order ? <OrderContextCard order={conv.order} t={t} /> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      ) : (
        <View
          style={[
            styles.flex,
            // Edge-to-edge (SDK 54) ignores adjustResize, and the reported
            // keyboard height excludes the nav-bar inset — add it back so the
            // input clears the keyboard instead of hiding behind it.
            {
              paddingBottom:
                keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0,
            },
          ]}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={styles.emptyWrap}>
                <Image
                  source={{ uri: SUPPORT_AVATAR }}
                  style={styles.emptyAvatar}
                  contentFit="cover"
                />
                <Text style={[styles.emptySub, { color: t.textSecondary }]}>
                  Send a message and our team will help you out. 👋
                </Text>
              </View>
            )}

            {messages.map((m) => {
              // Bubble side is purely sender_type — collision-proof per the API.
              const mine = m.sender_type === "customer"
              return mine ? (
                <View key={m.id} style={styles.userRow}>
                  <View style={styles.userCol}>
                    <View style={[styles.bubble, styles.userBubble]}>
                      <Text style={[styles.bubbleText, { color: "#fff" }]}>
                        {m.message}
                      </Text>
                    </View>
                    <Text
                      style={[styles.time, styles.timeRight, { color: t.textMuted }]}
                    >
                      {m.id < 0
                        ? "Sending…"
                        : formatManilaTime(m.created_at) +
                          (m.id === lastReadMineId ? " · Seen" : "")}
                    </Text>
                  </View>
                </View>
              ) : (
                <View key={m.id} style={styles.adminRow}>
                  <Image
                    source={{ uri: SUPPORT_AVATAR }}
                    style={styles.bubbleAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.adminCol}>
                    <View
                      style={[
                        styles.bubble,
                        styles.adminBubble,
                        { backgroundColor: adminBubbleBg, borderColor: t.border },
                      ]}
                    >
                      <Text style={[styles.bubbleText, { color: t.text }]}>
                        {m.message}
                      </Text>
                    </View>
                    <Text style={[styles.time, { color: t.textMuted }]}>
                      {formatManilaTime(m.created_at)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>

          {isResolved ? (
            <View
              style={[
                styles.closedBar,
                {
                  backgroundColor: t.card,
                  borderTopColor: t.border,
                  paddingBottom: insets.bottom + 10,
                },
              ]}
            >
              <Text style={[styles.closedText, { color: t.textSecondary }]}>
                This conversation is closed.
              </Text>
              <TouchableOpacity
                style={styles.reopenBtn}
                onPress={handleReopen}
                disabled={reopening}
                activeOpacity={0.8}
              >
                {reopening ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.reopenText}>Reopen chat</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.inputBar,
                {
                  backgroundColor: t.card,
                  borderTopColor: t.border,
                  paddingBottom: keyboardHeight > 0 ? 8 : insets.bottom + 8,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { backgroundColor: t.surface, color: t.text }]}
                placeholder="Type a message…"
                placeholderTextColor={t.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                selectionColor={Colors.sky}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.5 }]}
                onPress={() => send()}
                disabled={!input.trim() || sending}
                activeOpacity={0.8}
              >
                <Icon name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerInfo: { flex: 1 },
  headerAction: { paddingHorizontal: 8, paddingVertical: 4 },
  headerActionText: { fontSize: 13, fontWeight: "700", color: Colors.sky },
  headerName: { fontSize: 16, fontWeight: "800" },
  orderCard: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 2,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  orderHeadRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderTitle: { flex: 1, fontSize: 14, fontWeight: "800" },
  orderMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  orderAmount: { fontSize: 13, fontWeight: "800" },
  orderMeta: { fontSize: 12, fontWeight: "600" },
  orderRef: { fontSize: 11, fontWeight: "500", flexShrink: 1 },
  orderChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  orderChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  orderChipText: { fontSize: 10, fontWeight: "700" },
  headerStatus: { fontSize: 11, fontWeight: "500", color: "#22c55e", marginTop: 1 },
  messages: { padding: 14, paddingBottom: 8, gap: 10, flexGrow: 1 },
  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, gap: 8 },
  emptyAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  adminRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "86%" },
  adminCol: { flexShrink: 1 },
  userRow: { flexDirection: "row", justifyContent: "flex-end" },
  userCol: { maxWidth: "82%", alignItems: "flex-end" },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 16 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10 },
  adminBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  userBubble: {
    backgroundColor: Colors.sky,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 10, fontWeight: "500", marginTop: 4, marginLeft: 4 },
  timeRight: { marginLeft: 0, marginRight: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  closedBar: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  closedText: { fontSize: 13, fontWeight: "500" },
  reopenBtn: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.full,
    minWidth: 140,
    alignItems: "center",
  },
  reopenText: { color: "#fff", fontSize: 14, fontWeight: "700" },
})
