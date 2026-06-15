import { useQuery } from "@tanstack/react-query"
import { productService, type ProductCard } from "../../services/productService"

interface UseRelatedProductsOptions {
  productId?: number | null
  /** Optional — endpoint is public, but we forward it when available. */
  token?: string | null
  limit?: number
  enabled?: boolean
}

/**
 * Server-ranked "Related Products" for a product detail page
 * (GET /products/{id}/related). Public endpoint, so it runs for guests too;
 * keyed by productId + limit and cached so revisiting a product is instant.
 */
export const useRelatedProducts = ({
  productId,
  token,
  limit = 8,
  enabled = true,
}: UseRelatedProductsOptions) => {
  return useQuery<ProductCard[]>({
    queryKey: ["related-products", productId, limit],
    queryFn: () =>
      productService.getRelatedProducts(
        productId as number,
        limit,
        token ?? undefined
      ),
    enabled: enabled && !!productId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })
}
