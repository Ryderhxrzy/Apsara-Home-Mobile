import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface ReferralUser {
  id: number
  name: string
  username: string
  email: string
  avatar_url?: string
  joined_at: string
  total_earnings: number
  total_pv: number
  verification_status: string
  children_count?: number
  children?: ReferralUser[]
}

export interface ReferralSummary {
  direct_count: number
  second_level_count: number
  total_network: number
  total_pv: number
}

export interface ReferralTree {
  root: ReferralUser
  summary: ReferralSummary
  children: ReferralUser[]
}

export interface PublicProfile {
  username: string
  name: string
  avatar_url?: string
  avatar_original_url?: string
}

export interface ReferralAvailability {
  available: boolean
  message?: string
  normalized_referral?: string
  referrer_username?: string | null
}

export const referralService = {
  /**
   * Validate that a referral code / affiliate username exists and is usable.
   * Public endpoint (no auth) — mirrors the web app's check-referral query.
   */
  async checkReferral(referredBy: string): Promise<ReferralAvailability> {
    const params = { referred_by: referredBy }
    // Try the canonical path first, then the web app's documented fallbacks.
    const candidatePaths = [
      "/auth/register/check-referral",
      "/auth/check-referral",
      "/register/check-referral",
    ]

    let lastError: any = null
    for (const path of candidatePaths) {
      try {
        const response = await api.get(path, { params })
        return response.data
      } catch (error: any) {
        lastError = error
        // A 404 means the path doesn't exist on this backend — try the next.
        if (error.response?.status === 404) continue
        // Any other status (incl. 422) is an authoritative answer — stop.
        break
      }
    }

    throw {
      message:
        lastError?.response?.data?.message ||
        "Failed to validate referral code",
      details: lastError?.response?.data,
      status: lastError?.response?.status,
    }
  },

  async getReferralTree(token: string): Promise<ReferralTree> {
    try {
      const response = await api.get("/referral-tree", {
        headers: { Authorization: `Bearer ${token}` },
      })

      return response.data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load referral tree",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async getPublicProfile(username: string): Promise<PublicProfile> {
    try {
      const response = await api.get(
        `/public/profile/${encodeURIComponent(username)}`
      )
      return response.data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load referrer profile",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },
}
