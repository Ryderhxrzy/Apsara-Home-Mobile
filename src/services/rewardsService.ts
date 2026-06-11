import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: { "Content-Type": "application/json" },
})

/** One rung of the 7-day reward ladder. */
export interface CheckinLadderEntry {
  day: number
  pv: number
}

/** Optional per-day calendar state (authoritative "claimed" flags). */
export interface CheckinCalendarEntry {
  day: number
  pv?: number
  claimed?: boolean
  is_today_reward?: boolean
}

/** GET /rewards/check-in — the read-only board state used to draw the screen. */
export interface DailyCheckinBoard {
  checked_in_today: boolean
  can_check_in: boolean
  current_streak: number
  next_day_index: number
  next_reward_pv: number
  week_start?: string
  resets_at?: string
  ladder: CheckinLadderEntry[]
  calendar?: CheckinCalendarEntry[]
  total_checkins?: number
  total_pv_earned?: number
}

/** POST /rewards/check-in — the result of claiming today's check-in. */
export interface CheckinResult {
  message: string
  day_index: number
  earned_pv: number
  current_streak: number
  next_day_index: number
  next_reward_pv: number
}

const toError = (error: any) => ({
  message: error.response?.data?.message || "Something went wrong",
  details: error.response?.data,
  status: error.response?.status,
})

export const rewardsService = {
  /** Read the daily check-in board (which days are claimed, today's reward, streak). */
  async getDailyCheckin(token: string): Promise<DailyCheckinBoard> {
    try {
      const res = await api.get("/rewards/check-in", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data?.data || res.data
    } catch (error: any) {
      throw toError(error)
    }
  },

  /** Claim today's check-in (earns PV once per day). 409 = already checked in. */
  async claimDailyCheckin(token: string): Promise<CheckinResult> {
    try {
      const res = await api.post(
        "/rewards/check-in",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return res.data?.data || res.data
    } catch (error: any) {
      throw toError(error)
    }
  },
}
