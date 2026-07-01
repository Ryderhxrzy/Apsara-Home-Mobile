/**
 * Single source of truth for which price to show on product cards / detail.
 *
 * Guests (no auth token) always see the **SRP** with no member discount.
 * Members see the discounted **member price** (falling back to SRP) plus the
 * discount badge. This mirrors the backend, which returns SRP-only pricing to
 * unauthenticated requests.
 */

export interface DisplayPricing {
  /** The main price to render. */
  displayPrice: number
  /** SRP — shown as a strikethrough when discounted. */
  originalPrice: number
  /** True when displayPrice is below SRP (members only). */
  hasDiscount: boolean
  /** Whole-number discount percentage (0 for guests / no discount). */
  discountPct: number
}

export function getDisplayPricing(
  input: { memberPrice?: number | null; originalPrice?: number | null },
  isGuest: boolean
): DisplayPricing {
  const srp = Number(input.originalPrice) || 0
  const member = Number(input.memberPrice) || 0

  // Guests never get the member price — always show SRP, no discount.
  if (isGuest) {
    return {
      displayPrice: srp,
      originalPrice: srp,
      hasDiscount: false,
      discountPct: 0,
    }
  }

  const displayPrice = member || srp
  const hasDiscount = displayPrice < srp
  const discountPct =
    hasDiscount && srp > 0 ? Math.round(((srp - displayPrice) / srp) * 100) : 0

  return { displayPrice, originalPrice: srp, hasDiscount, discountPct }
}
