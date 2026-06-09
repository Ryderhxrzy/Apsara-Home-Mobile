import axios from "axios"
import { API_CONFIG } from "../config/api"

// Philippine address lookups. Tries the backend first and falls back to the
// public PSGC API so the form still works if the backend endpoint is down.
const api = axios.create({ baseURL: API_CONFIG.BASE_URL })
const PSGC_BASE = "https://psgc.gitlab.io/api"

export interface LocationData {
  code: string
  name: string
  zipCode?: string
}

const normalize = (items: any[]): LocationData[] =>
  (items || []).map((item) => ({
    code: String(item.code ?? item.id),
    name: item.name,
  }))

export const addressService = {
  async getRegions(): Promise<LocationData[]> {
    try {
      const res = await api.get("/address/regions")
      if (Array.isArray(res.data?.data)) return normalize(res.data.data)
    } catch {
      // fall through to PSGC
    }
    const res = await axios.get(`${PSGC_BASE}/regions/`)
    return normalize(res.data)
  },

  async getProvinces(regionCode: string): Promise<LocationData[]> {
    try {
      const res = await api.get(`/address/provinces?region_code=${regionCode}`)
      if (Array.isArray(res.data?.data)) return normalize(res.data.data)
    } catch {
      // fall through to PSGC
    }
    const res = await axios.get(`${PSGC_BASE}/regions/${regionCode}/provinces/`)
    return normalize(res.data)
  },

  // For NCR the "province" level is skipped, so cities are fetched by region.
  async getCities(code: string, isNCR = false): Promise<LocationData[]> {
    try {
      const param = isNCR ? "region_code" : "province_code"
      const res = await api.get(`/address/cities?${param}=${code}`)
      if (Array.isArray(res.data?.data)) return normalize(res.data.data)
    } catch {
      // fall through to PSGC
    }
    const psgcPath = isNCR
      ? `${PSGC_BASE}/regions/${code}/cities-municipalities/`
      : `${PSGC_BASE}/provinces/${code}/cities-municipalities/`
    const res = await axios.get(psgcPath)
    return normalize(res.data)
  },

  async getBarangays(cityCode: string): Promise<LocationData[]> {
    try {
      const res = await api.get(`/address/barangays?city_code=${cityCode}`)
      if (Array.isArray(res.data?.data)) return normalize(res.data.data)
    } catch {
      // fall through to PSGC
    }
    const res = await axios.get(
      `${PSGC_BASE}/cities-municipalities/${cityCode}/barangays/`
    )
    return normalize(res.data)
  },
}
