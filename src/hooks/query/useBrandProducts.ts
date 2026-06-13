import { useQuery } from "@tanstack/react-query"
import { productService } from "../../services/productService"

export interface BrandProduct {
  id: number
  name: string
  image: string
  price?: number
  priceMember?: number
  priceDp?: number
  original_price?: number
  discounted_price?: number
  prodpv?: string
  pv?: string
  musthave?: boolean
  bestseller?: boolean
  salespromo?: boolean
  originalPrice?: number
  memberPrice?: number
  priceSrp?: number
  soldCount?: number
  brand?: string
  variants?: unknown[]
  isZqProduct?: boolean
}

interface UseBrandProductsOptions {
  token?: string | null
  brandId?: number
  isZqBrand?: boolean
  page?: number
  perPage?: number
  roomId?: number | null
  categoryId?: number | null
  search?: string
  enabled?: boolean
}

interface BrandProductsResult {
  products: BrandProduct[]
  totalPages: number
  total: number
}

function normalizeZq(
  raw: Record<string, unknown>[],
  search: string
): BrandProduct[] {
  let filtered = raw
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = raw.filter((p) => {
      const dp = p.displayProduct as Record<string, unknown> | undefined
      const name = (dp?.name as string | undefined)?.toLowerCase() ?? ""
      const subject = (p.subject as string | undefined)?.toLowerCase() ?? ""
      return name.includes(q) || subject.includes(q)
    })
  }

  return filtered.map((p) => {
    const dp = p.displayProduct as Record<string, unknown> | undefined
    const salePrice = (dp?.price as number | undefined) ?? 0
    const comparePrice = (dp?.compareAtPrice as number | undefined) ?? salePrice
    return {
      id: p.id as number,
      name:
        (dp?.name as string | undefined) ||
        (p.subject as string | undefined) ||
        "",
      image:
        (dp?.image as string | undefined) ||
        (p.primaryImage as string | undefined) ||
        "",
      price: salePrice,
      priceMember: salePrice,
      original_price: comparePrice,
      memberPrice: salePrice,
      originalPrice: comparePrice,
      brand: (dp?.brand as string | undefined) || "",
      isZqProduct: true,
    }
  })
}

export const useBrandProducts = ({
  token,
  brandId,
  isZqBrand = false,
  page = 1,
  perPage = 20,
  roomId = null,
  categoryId = null,
  search = "",
  enabled = true,
}: UseBrandProductsOptions) => {
  return useQuery<BrandProductsResult>({
    queryKey: [
      "brand-products",
      token,
      isZqBrand,
      brandId ?? null,
      page,
      perPage,
      roomId,
      categoryId,
      search.trim(),
    ],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")

      if (isZqBrand) {
        const { products: raw, total, totalPages } =
          await productService.getZqCachedProducts(token, { search })
        return {
          products: normalizeZq(raw as Record<string, unknown>[], search),
          totalPages,
          total,
        }
      }

      if (!brandId) {
        return { products: [], totalPages: 0, total: 0 }
      }

      const { products, totalPages, total } =
        await productService.getBrandProductsPaged(token, brandId, {
          page,
          perPage,
          roomId,
          categoryId,
          search,
        })

      return { products: products as BrandProduct[], totalPages, total }
    },
    enabled: enabled && !!token && (isZqBrand || !!brandId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
