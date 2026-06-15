import { useQuery } from "@tanstack/react-query"
import { productService, type ProductCard } from "../../services/productService"

interface UseShowcaseProductsOptions {
  token?: string | null
  /** How many products to surface across the home rails. */
  count?: number
  enabled?: boolean
}

/**
 * Randomized active-product feed for the home screen's product rails (so the
 * page doesn't feel empty). Backed by GET /products?per_page=200&status=1 then
 * shuffled in the service — refetch (pull-to-refresh / shuffle) yields a fresh
 * random set. Cached for a few minutes so tab switches don't re-shuffle.
 */
export const useShowcaseProducts = ({
  token,
  count = 24,
  enabled = true,
}: UseShowcaseProductsOptions) => {
  return useQuery<ProductCard[]>({
    queryKey: ["showcase-products", token, count],
    queryFn: () =>
      productService.getShowcaseProducts(token ?? undefined, { count }),
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  })
}
