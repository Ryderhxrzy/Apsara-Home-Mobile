import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_CONFIG } from "../config/api"
import { normalizeZqProduct, type ZqProduct } from "./adapters/zqAdapter"

// Last-known ZQ brand names, cached so a transient failure of the ZQ endpoint
// doesn't hide ZQ brands (which usually have 0 regular products) from the UI.
const ZQ_BRAND_NAMES_CACHE_KEY = "apsara_cache:zq_brand_names"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface Product {
  id: number
  soldCount: number
  avgRating: number
  supplierId: number
  supplierName: string | null
  name: string
  description: string
  specifications: string
  material: string
  warranty: string
  catid: number
  catsubid: number
  roomType: number
  brandType: number
  brand: string
  priceSrp: number
  priceDp: number
  priceMember: number
  prodpv: number
  qty: number
  weight: number
  psweight: number
  pswidth: number
  pslenght: number
  psheight: number
  assemblyRequired: boolean
  type: number
  musthave: boolean
  bestseller: boolean
  salespromo: boolean
  manualCheckoutEnabled: boolean
  status: number
  sku: string
  uploaderName: string
  uploaderEmail: string | null
  uploaderRole: string
  image: string
  images: string[]
  variants: Array<{
    id: number
    sku: string
    name: string
    color: string
    colorHex: string
    size: string
    style: string
    width: number | null
    dimension: string | null
    height: number | null
    priceSrp: number
    priceDp: number
    priceMember: number
    prodpv: number
    qty: number
    status: number
    images: string[]
  }>
  createdAt: string
  updatedAt: string
}

export interface ProductCard {
  id: number
  name: string
  image: string
  soldCount: number
  originalPrice: number
  memberPrice: number
  pv: number
  brandName: string
  variantCount: number
  categoryId?: number
  brandId?: number
  badges: {
    musthave: boolean
    bestseller: boolean
    salespromo: boolean
  }
}

export function toProductCard(p: Product): ProductCard {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    soldCount: p.soldCount,
    originalPrice: p.priceSrp,
    memberPrice: p.priceMember,
    pv: p.prodpv,
    brandName: p.brand,
    variantCount: p.variants?.length ?? 0,
    categoryId: p.catid,
    brandId: p.brandType,
    badges: {
      musthave: p.musthave,
      bestseller: p.bestseller,
      salespromo: p.salespromo,
    },
  }
}

export interface ProductReview {
  id: number
  rating: number
  review: string
  review_image?: string
  review_video?: string
  review_images: string[]
  review_videos: string[]
  customer_name: string
  customer_avatar?: string
  created_at: string
}

export interface ProductReviewsResponse {
  summary: {
    average: number
    count: number
    breakdown: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
  reviews: ProductReview[]
}

export const productService = {
  async getProductCards(token?: string): Promise<ProductCard[]> {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    try {
      const response = await api.get("/products", { headers })
      const products = response.data.products ?? []

      // Map API response to ProductCard interface
      return products.map((product: any) => ({
        id: product.id,
        name: product.name,
        image: product.image,
        soldCount: product.soldCount,
        originalPrice: product.priceSrp,
        memberPrice: product.priceMember,
        pv: product.prodpv,
        brandName: product.brand,
        variantCount: product.variants?.length ?? 0,
        badges: {
          musthave: product.musthave,
          bestseller: product.bestseller,
          salespromo: product.salespromo,
        },
      }))
    } catch (error) {
      console.error("Error fetching product cards:", error)
      throw error
    }
  },

  async getProducts(token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await api.get("/products", { headers })
      // Handle different response structures
      let products: Product[] = []

      if (Array.isArray(response.data)) {
        products = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data
      } else if (
        response.data.products &&
        Array.isArray(response.data.products)
      ) {
        products = response.data.products
      } else if (response.data.items && Array.isArray(response.data.items)) {
        products = response.data.items
      } else {
        console.warn("Unexpected API response structure:", response.data)
        products = []
      }

      return products
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  },

  async getProductById(id: number, token?: string): Promise<Product> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get(`/products/${id}`, { headers })
    return response.data.product || response.data.data || response.data
  },

  async getProductsByCategory(
    catid: number,
    token?: string
  ): Promise<Product[]> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get(`/products/category/${catid}`, { headers })
    return response.data.data || response.data || []
  },

  async getProductsByBrand(
    brandType: number,
    token?: string
  ): Promise<Product[]> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get(`/products?brand_type=${brandType}`, {
      headers,
    })
    const products =
      response.data?.products || response.data?.data || response.data || []
    return products // Return all products for shuffling
  },

  async getProductsByRoom(
    roomType: number,
    token?: string
  ): Promise<Product[]> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get(
      `/products?room_type=${roomType}&status=1&page=1&per_page=20`,
      { headers }
    )
    const data =
      response.data?.data || response.data?.products || response.data || []
    return Array.isArray(data) ? data : []
  },

  async getProductReviews(
    productId: number,
    token?: string
  ): Promise<ProductReviewsResponse | null> {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await api.get(`/products/${productId}/reviews`, {
        headers,
      })
      return response.data || null
    } catch (error) {
      console.error("Error fetching product reviews:", error)
      return null
    }
  },

  async getWishlist(token: string): Promise<any[]> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    try {
      const response = await api.get("/wishlist", { headers })
      const data = response.data?.data || []

      // Convert object to array if needed
      if (typeof data === "object" && !Array.isArray(data)) {
        return Object.values(data)
      }

      return data
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      throw error
    }
  },

  async getShopByRooms(token?: string): Promise<any[]> {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    try {
      const response = await api.get("/home/shop/rooms", { headers })
      return (response.data?.rooms || []).map((room: any) => ({
        room_id: room.id,
        room_name: room.name,
        image: room.image,
        count: 0,
      }))
    } catch (error) {
      console.error("Error fetching shop by rooms:", error)
      return []
    }
  },

  async getShopByCategories(token?: string): Promise<any[]> {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    try {
      const response = await api.get("/home/shop/categories", { headers })
      return (response.data?.categories || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        url: category.url,
      }))
    } catch (error) {
      console.error("Error fetching shop by categories:", error)
      return []
    }
  },

  async getShopByBrands(token?: string): Promise<any[]> {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    try {
      const response = await api.get("/home/shop/brands", { headers })
      // Return all fields so callers can inspect any external-product indicators
      return (response.data?.brands || []).map((brand: any) => ({ ...brand }))
    } catch (error) {
      console.error("Error fetching shop by brands:", error)
      return []
    }
  },

  async getSearchRecommendations(
    token: string,
    limit: number = 12
  ): Promise<any[]> {
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const response = await api.get(`/search/recommendations?limit=${limit}`, {
        headers,
      })
      if (response.data?.success && Array.isArray(response.data?.data)) {
        const seen = new Set<number>()
        return response.data.data.filter((item: any) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      }
      return []
    } catch (error) {
      console.error("Error fetching search recommendations:", error)
      return []
    }
  },

  async getWishlistCount(productId: number, token: string): Promise<number> {
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const response = await api.get(`/wishlist/count/${productId}`, {
        headers,
      })
      return response.data?.wishlist_count ?? 0
    } catch (error) {
      console.error("Failed to fetch wishlist count:", error)
      throw error
    }
  },

  async getBrandProductsPaged(
    token: string,
    brandType: number,
    options: {
      page?: number
      perPage?: number
      roomId?: number | null
      categoryId?: number | null
      search?: string
    } = {}
  ): Promise<{ products: any[]; totalPages: number; total: number }> {
    const headers = { Authorization: `Bearer ${token}` }
    const {
      page = 1,
      perPage = 20,
      roomId = null,
      categoryId = null,
      search,
    } = options

    let url = `${API_CONFIG.BASE_URL}/products?status=1&page=${page}&per_page=${perPage}&brand_type=${brandType}`
    if (roomId) url += `&room_type=${roomId}`
    if (categoryId) url += `&cat_id=${categoryId}`
    if (search && search.trim()) url += `&search=${encodeURIComponent(search)}`

    const response = await axios.get(url, { headers })
    let products = response.data?.data || response.data?.products || []
    if (!Array.isArray(products)) products = []

    const total =
      response.data?.meta?.total ||
      response.data?.total ||
      response.data?.pagination?.total ||
      products.length
    const totalPages = Math.ceil(total / perPage)

    return { products, totalPages, total }
  },

  async getZqCachedProducts(
    token: string,
    options: { page?: number; perPage?: number; search?: string } = {}
  ): Promise<{ products: any[]; total: number; totalPages: number }> {
    const headers = { Authorization: `Bearer ${token}` }
    const { page = 1, perPage = 16, search } = options

    const url = new URL(`${API_CONFIG.BASE_URL}/products/zq/cached`)
    url.searchParams.set("page", String(page))
    url.searchParams.set("per_page", String(perPage))
    if (search?.trim()) url.searchParams.set("search", search.trim())

    const response = await axios.get(url.toString(), { headers })

    const products = response.data?.products ?? response.data?.data ?? []
    const total =
      response.data?.meta?.total ??
      response.data?.total ??
      response.data?.pagination?.total ??
      products.length
    const totalPages = Math.ceil(total / perPage) || 1

    return { products: Array.isArray(products) ? products : [], total, totalPages }
  },

  /**
   * Fetch a single ZQ product from its separate backend and normalize it to the
   * canonical `Product` type, so ProductDetailScreen and the shared components
   * render it exactly like a regular product (variants come from ZQ `specs`).
   */
  async getZqProductById(id: number, token?: string): Promise<Product> {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await api.get(`/products/zq/cached/${id}`, { headers })
    const raw = (response.data?.product ?? response.data) as ZqProduct
    return normalizeZqProduct(raw)
  },

  async getZqBrandNames(token?: string): Promise<Set<string>> {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    try {
      const response = await api.get("/products/zq/cached", { headers })
      const products: any[] = response.data?.products || []
      const names = new Set<string>()
      products.forEach((p) => {
        const brand: string | undefined =
          p.displayProduct?.brand || p.brand || p.brandName
        if (brand) names.add(brand.trim().toLowerCase())
      })
      // Cache only a successful, non-empty result. (An empty result is trusted
      // as "no ZQ brands" and intentionally not cached, so removed brands clear.)
      if (names.size > 0) {
        AsyncStorage.setItem(
          ZQ_BRAND_NAMES_CACHE_KEY,
          JSON.stringify([...names])
        ).catch(() => {})
      }
      return names
    } catch {
      // Endpoint failed — fall back to the last-known ZQ brand names so ZQ
      // brands don't disappear on a transient error.
      try {
        const cached = await AsyncStorage.getItem(ZQ_BRAND_NAMES_CACHE_KEY)
        if (cached) return new Set<string>(JSON.parse(cached))
      } catch {
        // ignore cache read errors
      }
      return new Set()
    }
  },
}

export default productService
