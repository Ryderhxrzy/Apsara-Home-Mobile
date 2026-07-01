import { useInfiniteQuery } from "@tanstack/react-query"
import { productService } from "../../services/productService"

export interface BrandProduct {
  id: number
  name: string
  image: string
  priceMember?: number
  priceDp?: number
  priceSrp?: number
  originalPrice?: number
  memberPrice?: number
  prodpv?: string
  musthave?: boolean
  bestseller?: boolean
  salespromo?: boolean
  soldCount?: number
  brand?: string
  variants?: unknown[]
  isZqProduct?: boolean
}

interface UseInfiniteBrandProductsOptions {
  token?: string | null
  brandId?: number
  isZqBrand?: boolean
  perPage?: number
  categoryId?: number | null
  search?: string
  enabled?: boolean
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
      priceMember: salePrice,
      memberPrice: salePrice,
      priceSrp: comparePrice,
      originalPrice: comparePrice,
      brand: (dp?.brand as string | undefined) || "",
      isZqProduct: true,
    }
  })
}

export const useInfiniteBrandProducts = ({
  token,
  brandId,
  isZqBrand = false,
  perPage = 16,
  categoryId = null,
  search = "",
  enabled = true,
}: UseInfiniteBrandProductsOptions) => {
  return useInfiniteQuery({
    queryKey: [
      "brand-products-infinite",
      token,
      isZqBrand,
      brandId ?? null,
      perPage,
      categoryId,
      search.trim(),
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number

      if (isZqBrand) {
        // ZQ catalog requires auth — guests get an empty (but valid) page so the
        // brand store still renders instead of erroring.
        if (!token) {
          return { products: [], total: 0, hasMore: false, pageParam: page }
        }
        const {
          products: raw,
          total,
          totalPages,
        } = await productService.getZqCachedProducts(token, {
          page,
          perPage,
          search,
        })
        return {
          products: normalizeZq(raw as Record<string, unknown>[], search),
          total,
          hasMore: page < totalPages,
          pageParam: page,
        }
      }

      if (!brandId) {
        return { products: [], total: 0, hasMore: false, pageParam: 1 }
      }

      const { products, totalPages, total } =
        await productService.getBrandProductsPaged(token, brandId, {
          page,
          perPage,
          categoryId,
          search,
        })

      return {
        products: products as BrandProduct[],
        total,
        hasMore: page < totalPages,
        pageParam: page,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.pageParam + 1 : undefined,
    initialPageParam: 1,
    // No token gate — the regular brand catalog is public, so guests can browse a
    // brand's "For You" products too (previously this stayed disabled for guests,
    // leaving the store empty → "This brand hasn't set up its store yet").
    enabled: enabled && (isZqBrand || !!brandId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}
