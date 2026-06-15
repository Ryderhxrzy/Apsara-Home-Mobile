import { useQuery, useQueryClient } from "@tanstack/react-query"
import { productService, type ProductCard } from "../../services/productService"

interface UseWishlistRecommendationsOptions {
  token?: string | null
  /** 1–50, default 12 (the endpoint caps it). */
  limit?: number
  enabled?: boolean
}

interface RecommendationsResult {
  products: ProductCard[]
  source: "wishlist" | "popular"
  meta: any
}

/**
 * Wishlist-seeded recommendations for the Shop "Recommended for you" rail
 * (GET /wishlist/recommendations). Auth-gated, so disabled for guests. Use
 * `source` to title the rail ("Recommended for you" vs "Popular right now").
 * Invalidated when the wishlist changes so new suggestions exclude what was
 * just saved — see useInvalidateWishlistRecommendations / useWishlist.
 */
export const useWishlistRecommendations = ({
  token,
  limit = 12,
  enabled = true,
}: UseWishlistRecommendationsOptions) => {
  return useQuery<RecommendationsResult>({
    queryKey: ["wishlist-recommendations", token, limit],
    queryFn: () =>
      productService.getWishlistRecommendations(token as string, limit),
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  })
}

export const useInvalidateWishlistRecommendations = () => {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ["wishlist-recommendations"] })
}
