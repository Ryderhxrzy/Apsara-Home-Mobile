import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Local, on-device cart for guests (no auth token → no server cart).
 *
 * Items are stored in the SAME shape the server `/cart` endpoint returns
 * (CartItem) so CartScreen / CheckoutScreen can render guest items with minimal
 * branching. Guests are billed at SRP, so the unit/member prices all mirror SRP.
 */

const GUEST_CART_KEY = "apsara_guest_cart"

export interface GuestCartItem {
  crt_id: number
  crt_customer_id: number
  crt_product_id: number
  crt_variant_id: number | null
  crt_quantity: number
  crt_selected_color: string | null
  crt_selected_size: string | null
  crt_selected_type: string | null
  crt_unit_price: string
  crt_total_price: string
  crt_status: string
  crt_created_at: string
  crt_updated_at: string
  product_name: string
  product_image: string
  product_price_srp: string
  product_price_dp: string
  product_price_member: string
  product_prodpv: string
  brand_name: string
  variant_id: number | null
  variant_name: string | null
  variant_price: string | null
  variant_price_dp: string | null
  variant_price_member: string | null
  variant_prodpv: string | null
  variant_color: string | null
  variant_size: string | null
  variant_image: string | null
  variant_status: number | null
}

/** Normalized input used when adding to the guest cart. */
export interface AddGuestCartInput {
  productId: number
  productName: string
  productImage?: string
  brandName?: string
  /** SRP unit price — what guests pay. */
  unitPriceSrp: number
  pv?: number
  quantity: number
  variantId?: number | null
  variantName?: string | null
  variantColor?: string | null
  variantSize?: string | null
  variantImage?: string | null
}

async function readAll(): Promise<GuestCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeAll(items: GuestCartItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  } catch {
    // best-effort persistence
  }
}

export const guestCartService = {
  async getItems(): Promise<GuestCartItem[]> {
    return readAll()
  },

  async count(): Promise<number> {
    const items = await readAll()
    return items.reduce((sum, it) => sum + (it.crt_quantity || 0), 0)
  },

  /**
   * Add an item (or bump quantity if the same product+variant already exists).
   * Returns the updated cart.
   */
  async addItem(input: AddGuestCartInput): Promise<GuestCartItem[]> {
    const items = await readAll()
    const srp = Number(input.unitPriceSrp) || 0
    const qty = Math.max(1, input.quantity || 1)
    const variantId = input.variantId ?? null

    const existing = items.find(
      (it) =>
        it.crt_product_id === input.productId &&
        (it.crt_variant_id ?? null) === variantId
    )

    const now = new Date().toISOString()

    if (existing) {
      existing.crt_quantity += qty
      existing.crt_total_price = String(srp * existing.crt_quantity)
      existing.crt_updated_at = now
    } else {
      const srpStr = String(srp)
      items.push({
        // Synthetic, negative id space so it never collides with server crt_id.
        crt_id: -Date.now(),
        crt_customer_id: 0,
        crt_product_id: input.productId,
        crt_variant_id: variantId,
        crt_quantity: qty,
        crt_selected_color: input.variantColor ?? null,
        crt_selected_size: input.variantSize ?? null,
        crt_selected_type: null,
        crt_unit_price: srpStr,
        crt_total_price: String(srp * qty),
        crt_status: "active",
        crt_created_at: now,
        crt_updated_at: now,
        product_name: input.productName,
        product_image: input.productImage || "",
        product_price_srp: srpStr,
        // Guests pay SRP — DP/member mirror SRP so totals stay consistent.
        product_price_dp: srpStr,
        product_price_member: srpStr,
        product_prodpv: String(input.pv ?? 0),
        brand_name: input.brandName || "",
        variant_id: variantId,
        variant_name: input.variantName ?? null,
        variant_price: variantId != null ? srpStr : null,
        variant_price_dp: variantId != null ? srpStr : null,
        variant_price_member: variantId != null ? srpStr : null,
        variant_prodpv: variantId != null ? String(input.pv ?? 0) : null,
        variant_color: input.variantColor ?? null,
        variant_size: input.variantSize ?? null,
        variant_image: input.variantImage ?? null,
        variant_status: variantId != null ? 1 : null,
      })
    }

    await writeAll(items)
    return items
  },

  async updateQuantity(
    crtId: number,
    quantity: number
  ): Promise<GuestCartItem[]> {
    const items = await readAll()
    const item = items.find((it) => it.crt_id === crtId)
    if (item) {
      item.crt_quantity = Math.max(1, quantity)
      item.crt_total_price = String(
        (Number(item.crt_unit_price) || 0) * item.crt_quantity
      )
      item.crt_updated_at = new Date().toISOString()
      await writeAll(items)
    }
    return items
  },

  async removeItem(crtId: number): Promise<GuestCartItem[]> {
    const items = (await readAll()).filter((it) => it.crt_id !== crtId)
    await writeAll(items)
    return items
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GUEST_CART_KEY)
    } catch {
      // ignore
    }
  },
}
