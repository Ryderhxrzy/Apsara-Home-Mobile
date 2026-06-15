import { useQuery, useQueryClient } from "@tanstack/react-query"
import { productService } from "../services/productService"

interface WishlistItem {
  wishlist_id: number
  product_id: number
  date_added: string
  product: {
    id: number
    name: string
    brand: string
    image: string
    priceSrp: number
    priceMember: number
    avgRating: number
    qty: number
    prodpv: number
  }
}

interface UseWishlistOptions {
  token?: string | null
  enabled?: boolean
}

export const useWishlist = ({ token, enabled = true }: UseWishlistOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<WishlistItem[]>({
    queryKey: ["wishlist", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return productService.getWishlist(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateWishlist = async () => {
    // Refresh BOTH the global wishlist (badge/heart state) AND the Wishlist
    // screen's infinite/searchable query so adds/removes from anywhere
    // (e.g. the Shop heart) show up on the Wishlist page. Also refresh the
    // wishlist-seeded recommendations so new suggestions exclude what was just
    // saved (the Shop "Recommended for you" rail).
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
      queryClient.invalidateQueries({ queryKey: ["wishlist-infinite"] }),
      queryClient.invalidateQueries({ queryKey: ["wishlist-recommendations"] }),
    ])
  }

  return {
    ...query,
    invalidateWishlist,
    isFetching: query.isFetching,
  }
}
