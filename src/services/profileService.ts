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

export const profileService = {
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

  // Returns the new avatar URL, or null if the backend didn't return one.
  async uploadAvatar(token: string, uri: string): Promise<string | null> {
    try {
      const filename = uri.split("/").pop() || "avatar.jpg"
      const formData = new FormData()
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: filename,
      } as any)

      const res = await api.post("/me/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      return res.data?.avatar_url || res.data?.data?.avatar_url || null
    } catch (error: any) {
      throw toError(error, "Failed to upload avatar")
    }
  },
}
