import axios from "axios"
import { API_CONFIG } from "../config/api"

export type ConversationStatus = "open" | "pending" | "resolved"

export interface ChatMessage {
  id: number
  conversation_id: number
  sender_id: number
  sender_type: "customer" | "admin" // is_mine = sender_type === "customer"
  message: string
  attachment_url: string | null
  attachment_filename: string | null
  is_read: boolean
  read_at: string | null
  created_at: string // "Y-m-d H:i:s" Asia/Manila (no tz suffix)
  updated_at: string
}

/**
 * Order context for an order-scoped conversation (subject "Order {checkout_id}").
 * Present only when the thread was started from a specific order; otherwise the
 * conversation's `order` field is null. See docs/CHAT_MOBILE_API.md §2.4.
 */
export interface ConversationOrder {
  reference: string // the order/checkout id (e.g. "cs_00c8…")
  product_name: string | null
  amount: number | null // PHP
  quantity: number | null
  payment_status: string | null
  approval_status: string | null
  fulfillment_status: string | null
}

export interface Conversation {
  id: number
  subject: string
  description: string | null
  order: ConversationOrder | null
  status: ConversationStatus
  assigned_agent_id: number | null
  assigned_agent: { id: number; name: string; email: string } | null
  last_message: {
    message: string
    sent_at: string
    sender_id: number
    sender_type: string
  } | null
  message_count: number
  unread_count: number
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
})

/**
 * Timestamps arrive as Manila wall-clock "Y-m-d H:i:s" (no tz suffix). Read the
 * time part directly so display matches what was sent, regardless of device tz.
 */
export const formatManilaTime = (ts?: string | null): string => {
  if (!ts) return ""
  const timePart = ts.includes("T") ? ts.split("T")[1] : ts.split(" ")[1]
  if (!timePart) return ""
  const [hStr, mStr] = timePart.split(":")
  let h = parseInt(hStr, 10)
  if (isNaN(h)) return ""
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${h}:${mStr || "00"} ${ampm}`
}

export const conversationService = {
  /** List the customer's conversations (newest activity first, per backend). */
  async listConversations(
    token: string,
    opts: { status?: string; perPage?: number } = {}
  ): Promise<{ conversations: Conversation[]; meta: PageMeta | null }> {
    const params: Record<string, string | number> = {
      per_page: opts.perPage ?? 50,
    }
    if (opts.status) params.status = opts.status
    const res = await axios.get(`${API_CONFIG.BASE_URL}/conversations`, {
      headers: headers(token),
      params,
    })
    return {
      conversations: Array.isArray(res.data?.data) ? res.data.data : [],
      meta: res.data?.meta ?? null,
    }
  },

  /** Start a support thread, or transparently reuse the customer's open one. */
  async startConversation(token: string): Promise<Conversation> {
    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/conversations`,
      {},
      { headers: headers(token) }
    )
    return res.data?.data
  },

  /** Messages oldest-first; internal notes already excluded server-side. */
  async getMessages(
    token: string,
    conversationId: number,
    perPage = 50
  ): Promise<{ messages: ChatMessage[]; meta: PageMeta | null }> {
    const res = await axios.get(
      `${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`,
      { headers: headers(token), params: { per_page: perPage } }
    )
    return {
      messages: Array.isArray(res.data?.data) ? res.data.data : [],
      meta: res.data?.meta ?? null,
    }
  },

  /** Send a message. Throws 422 if the conversation is resolved (closed). */
  async sendMessage(
    token: string,
    conversationId: number,
    message: string
  ): Promise<ChatMessage> {
    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`,
      { message },
      { headers: headers(token) }
    )
    return res.data?.data
  },

  /** GET the detail endpoint — marks incoming messages as read. */
  async markRead(token: string, conversationId: number): Promise<Conversation | null> {
    const res = await axios.get(
      `${API_CONFIG.BASE_URL}/conversations/${conversationId}`,
      { headers: headers(token) }
    )
    return res.data?.data ?? null
  },

  /** Close (resolve) the conversation. Customer may reopen later. */
  async close(token: string, conversationId: number): Promise<Conversation> {
    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/conversations/${conversationId}/close`,
      {},
      { headers: headers(token) }
    )
    return res.data?.data
  },

  async reopen(token: string, conversationId: number): Promise<Conversation> {
    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/conversations/${conversationId}/reopen`,
      {},
      { headers: headers(token) }
    )
    return res.data?.data
  },

  async getUnreadCount(token: string): Promise<number> {
    const res = await axios.get(
      `${API_CONFIG.BASE_URL}/conversations/unread/count`,
      { headers: headers(token) }
    )
    return res.data?.unread_count ?? 0
  },
}
