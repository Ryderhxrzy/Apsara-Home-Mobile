import axios from "axios"
import { API_CONFIG } from "../config/api"

// Mirrors the backend's SupplierBrandHomeController::transformSection output and
// the supplier admin's supplierBrandHomeApi types, so the mobile "Home" tab and
// the web phone-preview render the exact same DB-driven sections.

export type SectionType = "banner" | "carousel" | "products" | "text"

export interface BannerContent {
  image_url: string
  link_type?: string | null
  link_target?: string | null
}

export interface CarouselItem {
  id?: number
  image_url: string
  order?: number
  link_type?: string | null
  link_target?: string | null
}

export interface SectionProduct {
  id: number
  order: number
  name: string
  image?: string | null
  price?: number | null
  original_price?: number | null
  member_price?: number | null
  pv?: number | null
}

export interface ProductSectionContent {
  label: string
  button_text?: string | null
  button_link?: string | null
  products: SectionProduct[]
}

export interface TextContent {
  // Rich-text HTML (sizes / bold / italic / alignment / emoji).
  body: string
  image_url?: string | null
}

export interface HomeSection {
  id: number
  type: SectionType
  order: number
  is_active: boolean
  banner?: BannerContent
  items?: CarouselItem[]
  product_section?: ProductSectionContent
  text?: TextContent
}

export interface BrandCover {
  image_url: string
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined

export const brandHomeService = {
  /** Active home sections for a brand, in display order. */
  async getBrandHome(
    brandId: number,
    token?: string | null
  ): Promise<HomeSection[]> {
    try {
      const response = await axios.get<{ sections?: HomeSection[] }>(
        `${API_CONFIG.BASE_URL}/product-brands/${brandId}/home`,
        { headers: authHeaders(token) }
      )
      const sections = response.data?.sections
      return Array.isArray(sections) ? sections : []
    } catch (error) {
      console.error("Error fetching brand home sections:", error)
      throw error
    }
  },

  /** The brand profile cover photo, or null when none is set. */
  async getBrandCover(
    brandId: number,
    token?: string | null
  ): Promise<BrandCover | null> {
    try {
      const response = await axios.get<{ cover?: BrandCover | null }>(
        `${API_CONFIG.BASE_URL}/product-brands/${brandId}/cover`,
        { headers: authHeaders(token) }
      )
      return response.data?.cover ?? null
    } catch (error) {
      console.error("Error fetching brand cover:", error)
      throw error
    }
  },
}
