import { useQuery } from "@tanstack/react-query"
import { productService, type Product } from "../../services/productService"

interface UseProductDetailOptions {
  productId: number
  token?: string | null
  /** When true, fetch from the ZQ separate backend (normalized to `Product`). */
  isZq?: boolean
  enabled?: boolean
}

export const useProductDetail = ({
  productId,
  token,
  isZq = false,
  enabled = true,
}: UseProductDetailOptions) => {
  return useQuery<Product>({
    // `isZq` is part of the key so ZQ and regular products of the same numeric
    // id never collide in the cache.
    queryKey: ["product-detail", isZq ? "zq" : "std", token, productId],
    queryFn: async () =>
      isZq
        ? productService.getZqProductById(productId, token ?? undefined)
        : productService.getProductById(productId, token ?? undefined),
    enabled: enabled && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
