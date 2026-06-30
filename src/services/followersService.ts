import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface FollowMutationResponse {
  message: string
  is_following: boolean
  followers_count: number
}

export interface FollowingResponse {
  user_id: number
  following: number[]
}

export interface BrandFollowerCountResponse {
  brand_id: number
  followers_count: number
}

function toServiceError(error: any, fallback: string) {
  return {
    message: error.response?.data?.message || fallback,
    details: error.response?.data,
    status: error.response?.status,
  }
}

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

/** Coerce the backend's is_following (boolean | 0/1, possibly nested) to a real boolean. */
function readIsFollowing(data: any): boolean {
  const raw = data?.is_following ?? data?.data?.is_following ?? data
  return raw === true || raw === 1
}

export const followersService = {
  /** Follow a brand. Returns the live follow state + count after the change. */
  async follow(
    token: string,
    brandId: number
  ): Promise<FollowMutationResponse> {
    try {
      const res = await api.post(
        "/followers/follow",
        { brand_id: brandId },
        authHeaders(token)
      )
      return res.data
    } catch (error: any) {
      throw toServiceError(error, "Failed to follow brand")
    }
  },

  /** Unfollow a brand (idempotent). Returns the live follow state + count. */
  async unfollow(
    token: string,
    brandId: number
  ): Promise<FollowMutationResponse> {
    try {
      const res = await api.post(
        "/followers/unfollow",
        { brand_id: brandId },
        authHeaders(token)
      )
      return res.data
    } catch (error: any) {
      throw toServiceError(error, "Failed to unfollow brand")
    }
  },

  /** Brand IDs the current user follows. */
  async getFollowing(token: string): Promise<number[]> {
    try {
      const res = await api.get<FollowingResponse>(
        "/followers/following",
        authHeaders(token)
      )
      return res.data?.following ?? []
    } catch (error: any) {
      throw toServiceError(error, "Failed to load followed brands")
    }
  },

  /** Public follower count for a single brand (no auth required). */
  async getBrandFollowerCount(brandId: number): Promise<number> {
    try {
      const res = await api.get<BrandFollowerCountResponse>(
        `/product-brands/${brandId}/followers/count`
      )
      return res.data?.followers_count ?? 0
    } catch (error: any) {
      throw toServiceError(error, "Failed to load follower count")
    }
  },

  /** Whether the current user follows one brand. */
  async isFollowing(token: string, brandId: number): Promise<boolean> {
    try {
      const res = await api.post(
        "/followers/is-following",
        { brand_id: brandId },
        authHeaders(token)
      )
      return readIsFollowing(res.data)
    } catch (error: any) {
      throw toServiceError(error, "Failed to check follow status")
    }
  },
}
