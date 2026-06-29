import { useQuery } from "@tanstack/react-query"
import {
  brandHomeService,
  type BrandCover,
  type HomeSection,
} from "../../services/brandHomeService"

interface UseBrandHomeOptions {
  token?: string | null
  brandId?: number
  enabled?: boolean
}

interface BrandHomeResult {
  sections: HomeSection[]
  cover: BrandCover | null
}

/**
 * Loads a brand's customer-facing mobile home (DB-driven sections + cover photo)
 * from the public read endpoints. ZQ/global brands have no builder, so callers
 * should pass enabled=false for them.
 */
export const useBrandHome = ({
  token,
  brandId,
  enabled = true,
}: UseBrandHomeOptions) => {
  return useQuery<BrandHomeResult>({
    queryKey: ["brand-home", brandId ?? null],
    queryFn: async () => {
      if (!brandId) return { sections: [], cover: null }

      // Cover is non-critical: a missing/failed cover must not blank the sections.
      const [sections, cover] = await Promise.all([
        brandHomeService.getBrandHome(brandId, token),
        brandHomeService.getBrandCover(brandId, token).catch(() => null),
      ])

      return { sections, cover }
    },
    enabled: enabled && !!brandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
