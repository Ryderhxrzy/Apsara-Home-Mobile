import type { Product, ProductCard } from "../productService"

/**
 * Brand adapter: ZQ (separate dropshipping backend).
 *
 * ZQ products come from a different endpoint (`/products/zq/cached/...`) with a
 * different shape than the main catalog. To keep ALL product UI reusable, we
 * normalize ZQ responses into the canonical `Product` / `ProductCard` types the
 * shared components already consume — instead of branching the components.
 *
 * To add another brand with a separate backend, mirror this file:
 *   - declare its raw response types,
 *   - write `normalize<Brand>Product(raw): Product` and
 *     `normalize<Brand>Card(raw): ProductCard`,
 *   - add a `get<Brand>ProductById` method in productService,
 *   - route to it from useProductDetail via a brand flag.
 */

// --- Raw ZQ response shapes ------------------------------------------------

export interface ZqSpec {
  id: string
  sku: string
  name: string
  /** Price in cents (sale/member price for this variant). */
  priceCents: number
  stock: number
  image: string
}

export interface ZqDisplayProduct {
  id: string // e.g. "zq-7999"
  name: string
  brand: string
  category: string | null
  image: string
  images: string[]
  /** Sale price in major units (e.g. 144.95). */
  price: number
  /** "Was"/compare-at price in major units (e.g. 262.35). */
  compareAtPrice: number
  stock: number
  sku: string
}

export interface ZqProduct {
  id: number
  externalId: string
  offerId: string
  brandType: number | null
  zqCategoryId: string | null
  subject: string
  subjectCn: string
  categoryName: string | null
  primaryImage: string
  images: string[]
  sourceType: string
  status: string // e.g. "PUBLISHED"
  productUrl: string
  targetCurrency: string
  shippingTo: string
  priceMinCents: number
  priceMaxCents: number
  costMinCents: number
  costMaxCents: number
  totalStock: number
  variantCount: number
  publishedAt: string
  sourceCreatedAt: string
  sourceUpdatedAt: string
  syncedAt: string
  displayProduct: ZqDisplayProduct
  description: string
  specs: ZqSpec[]
}

/** The detail endpoint wraps the product: `{ product: ZqProduct }`. */
export interface ZqProductResponse {
  product: ZqProduct
}

// --- Normalizers -----------------------------------------------------------

const centsToMajor = (cents: number | undefined): number =>
  Math.round(((cents ?? 0) / 100) * 100) / 100

/** ZQ "PUBLISHED" → canonical numeric status (1 = active). */
const zqStatus = (status: string | undefined): number =>
  status === "PUBLISHED" ? 1 : 0

/**
 * Map ZQ `specs[]` → canonical product `variants[]`.
 *
 * ZQ specs carry a single combined `name` ("60cm diameter + black / Three color
 * dimming") and one price (`priceCents`). There is no per-variant compare price,
 * so srp = member = the spec price. The combined label is kept in both `name`
 * and `size` so the variant selector renders it regardless of which it reads.
 */
const toVariant = (spec: ZqSpec): Product["variants"][number] => {
  const price = centsToMajor(spec.priceCents)
  return {
    id: Number(spec.id),
    sku: spec.sku,
    name: spec.name,
    color: "",
    colorHex: "",
    size: spec.name,
    style: "",
    width: null,
    dimension: null,
    height: null,
    priceSrp: price,
    priceDp: price,
    priceMember: price,
    prodpv: 0,
    qty: spec.stock ?? 0,
    status: 1,
    images: spec.image ? [spec.image] : [],
  }
}

/** Normalize a raw ZQ product into the canonical `Product` type. */
export function normalizeZqProduct(raw: ZqProduct): Product {
  const dp = raw.displayProduct
  const memberPrice = dp?.price ?? centsToMajor(raw.priceMinCents)
  const comparePrice = dp?.compareAtPrice ?? centsToMajor(raw.priceMaxCents)
  const images =
    dp?.images?.length ? dp.images : raw.images?.length ? raw.images : []

  return {
    id: raw.id,
    soldCount: 0,
    avgRating: 0,
    supplierId: 0,
    supplierName: null,
    name: dp?.name || raw.subject || "",
    description: raw.description || "",
    specifications: "",
    material: "",
    warranty: "",
    catid: 0,
    catsubid: 0,
    roomType: 0,
    brandType: raw.brandType ?? 0,
    brand: dp?.brand || "",
    priceSrp: comparePrice,
    priceDp: memberPrice,
    priceMember: memberPrice,
    prodpv: 0,
    qty: raw.totalStock ?? dp?.stock ?? 0,
    weight: 0,
    psweight: 0,
    pswidth: 0,
    pslenght: 0,
    psheight: 0,
    assemblyRequired: false,
    type: 0,
    musthave: false,
    bestseller: false,
    salespromo: comparePrice > memberPrice,
    manualCheckoutEnabled: false,
    status: zqStatus(raw.status),
    sku: dp?.sku || raw.externalId || "",
    uploaderName: "",
    uploaderEmail: null,
    uploaderRole: "",
    image: dp?.image || raw.primaryImage || "",
    images,
    variants: (raw.specs ?? []).map(toVariant),
    createdAt: raw.publishedAt || "",
    updatedAt: raw.syncedAt || "",
  }
}

/** Normalize a raw ZQ product into a `ProductCard` for list/grid rendering. */
export function normalizeZqCard(raw: ZqProduct): ProductCard {
  const dp = raw.displayProduct
  const memberPrice = dp?.price ?? centsToMajor(raw.priceMinCents)
  const comparePrice = dp?.compareAtPrice ?? centsToMajor(raw.priceMaxCents)
  return {
    id: raw.id,
    name: dp?.name || raw.subject || "",
    image: dp?.image || raw.primaryImage || "",
    soldCount: 0,
    originalPrice: comparePrice,
    memberPrice,
    pv: 0,
    brandName: dp?.brand || "",
    variantCount: raw.variantCount ?? raw.specs?.length ?? 0,
    badges: { musthave: false, bestseller: false, salespromo: false },
  }
}
