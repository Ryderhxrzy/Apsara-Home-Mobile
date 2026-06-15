import { useQuery } from "@tanstack/react-query"
import { userBehaviorService } from "../../services/userBehaviorService"
import type { ProductCard } from "../../services/productService"

interface UseBehaviorRecommendationsOptions {
  token?: string | null
  limit?: number
  enabled?: boolean
}

/**
 * Personalized product feed from the user's behavior (views, clicks, wishlist,
 * cart, purchases) — GET /user-behavior/recommendations. Auth-gated; returns an
 * empty list for new users with no history (the service swallows that), so
 * callers should fall back to a popular/random feed. The DTO is minimal
 * (id/name/image/prices/sold), mapped to ProductCard for the standard card.
 */
export const useBehaviorRecommendations = ({
  token,
  limit = 12,
  enabled = true,
}: UseBehaviorRecommendationsOptions) => {
  return useQuery<ProductCard[]>({
    queryKey: ["behavior-recommendations", token, limit],
    queryFn: async () => {
      const recs = await userBehaviorService.getRecommendations(
        token as string,
        limit
      )
      return recs.map(
        (r): ProductCard => ({
          id: r.id,
          name: r.name,
          image: r.image,
          soldCount: r.soldCount ?? 0,
          originalPrice: r.priceSrp ?? 0,
          memberPrice: r.priceMember ?? 0,
          pv: 0,
          brandName: "",
          variantCount: 0,
          badges: { musthave: false, bestseller: false, salespromo: false },
        })
      )
    },
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}
