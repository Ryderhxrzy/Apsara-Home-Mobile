import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({ baseURL: API_CONFIG.BASE_URL })

export interface ProfileUpdatePayload {
  name?: string
  last_name?: string
  phone?: string
  middle_name?: string
  birth_date?: string
  gender?: string
  occupation?: string
  work_location?: string
  country?: string
  address?: string
  region?: string
  province?: string
  city?: string
  barangay?: string
  zip_code?: string
}

interface ServiceError {
  message: string
  details?: any
  status?: number
}

const toError = (error: any, fallback: string): ServiceError => ({
  message: error.response?.data?.message || error.message || fallback,
  details: error.response?.data,
  status: error.response?.status,
})

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
})

export interface SecuritySettings {
  biometric_enabled: boolean
  [key: string]: any
}

export const profileService = {
  // GET /auth/me — the canonical current-user profile payload.
  async getCurrentUser(token: string): Promise<any> {
    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    } catch (error: any) {
      throw toError(error, "Failed to load profile details")
    }
  },

  // GET /user/security-settings — returns the biometric_enabled flag (and more).
  // Mirrors ProfileScreen's `res?.data?.data` unwrap with a false fallback.
  async getSecuritySettings(token: string): Promise<SecuritySettings> {
    try {
      const res = await api.get("/user/security-settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res?.data?.data
      return { biometric_enabled: data?.biometric_enabled ?? false, ...data }
    } catch (error: any) {
      throw toError(error, "Failed to load security settings")
    }
  },

  // GET /auth/mobile/check-google-linked — true when a Google account is linked.
  async getGoogleLinkedStatus(token: string): Promise<boolean> {
    try {
      const res = await api.get("/auth/mobile/check-google-linked", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res?.data?.linked === true
    } catch (error: any) {
      throw toError(error, "Failed to load Google linked status")
    }
  },

  // GET /public/top-members — public leaderboard list. Returns the raw member
  // array; callers derive a user's rank by index.
  async getTopMembers(
    sort = "referrals",
    perPage = 100
  ): Promise<any[]> {
    try {
      const res = await api.get("/public/top-members", {
        params: { sort, per_page: perPage },
      })
      return Array.isArray(res.data?.data) ? res.data.data : []
    } catch (error: any) {
      throw toError(error, "Failed to load top members")
    }
  },

  async updateProfile(token: string, payload: ProfileUpdatePayload) {
    try {
      const res = await api.put("/auth/me", payload, {
        headers: authHeaders(token),
      })
      return res.data
    } catch (error: any) {
      throw toError(error, "Failed to update profile")
    }
  },

  async updateName(token: string, name: string) {
    return this.updateProfile(token, { name })
  },

  /**
   * Upload a new profile photo as binary multipart (field name `file`) to
   * POST /me/avatar. Returns the new avatar URLs plus the updated user object
   * the backend echoes back, so callers can refresh global state everywhere.
   */
  async uploadAvatar(token: string, uri: string): Promise<AvatarUploadResult> {
    try {
      const filename = uri.split("/").pop() || "avatar.jpg"
      const match = /\.(\w+)$/.exec(filename)
      const ext = (match?.[1] || "jpg").toLowerCase()
      const mime = ext === "png" ? "image/png" : "image/jpeg"

      const formData = new FormData()
      formData.append("file", {
        uri,
        type: mime,
        name: filename,
      } as any)

      const res = await api.post("/me/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the platform set the multipart boundary automatically.
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      })

      const data = res.data?.data || res.data || {}
      const avatarUrl = data.avatar_url ?? data.user?.avatar_url ?? null
      return {
        avatarUrl,
        avatarOriginalUrl:
          data.avatar_original_url ?? data.user?.avatar_original_url ?? avatarUrl,
        user: data.user ?? null,
      }
    } catch (error: any) {
      throw toError(error, "Failed to upload avatar")
    }
  },
}

export interface AvatarUploadResult {
  avatarUrl: string | null
  avatarOriginalUrl: string | null
  user: any | null
}
