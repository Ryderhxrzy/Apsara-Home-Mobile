import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { productService } from "../../services/productService"

export interface WishlistEntry {
  wishlist_id: number
  customer_id?: number
  product_id: number
  date_added?: string
  product: any
}

interface WishlistMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
  search?: string | null
}

interface UseInfiniteWishlistOptions {
  token?: string | null
  search?: string
  perPage?: number
  enabled?: boolean
}

/**
 * Infinite (paginated) + searchable wishlist backed by
 * GET /wishlist?search=&page=&per_page=. `search` is part of the query key, so
 * typing a new term starts a fresh paginated result set. Pull `items` for a
 * flat, render-ready list and call `fetchNextPage` from FlashList's
 * onEndReached.
 */
export const useInfiniteWishlist = ({
  token,
  search = "",
  perPage = 12,
  enabled = true,
}: UseInfiniteWishlistOptions) => {
  const query = useInfiniteQuery({
    queryKey: ["wishlist-infinite", token, search.trim(), perPage],
    queryFn: async ({ pageParam = 1 }) => {
      if (!token) throw new Error("Token is required")
      const page = pageParam as number
      const { items, meta } = await productService.getWishlistPaged(token, {
        search,
        page,
        perPage,
      })
      return {
        items: items as WishlistEntry[],
        meta: meta as WishlistMeta,
        page,
      }
    },
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta
      return current_page < last_page ? current_page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  })

  // Flattened, render-ready list across all loaded pages.
  const items: WishlistEntry[] =
    query.data?.pages.flatMap((p) => p.items) ?? []
  const total = query.data?.pages[0]?.meta.total ?? items.length

  return { ...query, items, total }
}

/** Invalidate the wishlist infinite query (e.g. after add/remove). */
export const useInvalidateInfiniteWishlist = () => {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ["wishlist-infinite"] })
}
