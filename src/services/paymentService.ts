import axios from "axios"
import { API_CONFIG } from "../config/api"

export interface VoucherInfo {
  id: number
  code: string
  amount: number
  source_type: string
  max_uses: number | null
  used_count: number
  expires_at: string
}

export interface VoucherRule {
  product_id: number | null
  enabled: boolean
  max_discount: number
  min_spend: number
}

export interface VoucherValidation {
  valid: boolean
  message: string | null
  voucher?: VoucherInfo
  discount: number
  rule?: VoucherRule
}

export const paymentService = {
  /**
   * Validate a voucher code against the current cart before placing an order.
   * POST /payments/validate-voucher. On success returns { valid, discount,
   * voucher, rule }. On failure the backend responds 422 with
   * { message: "Voucher code is invalid or expired." } — axios throws, so the
   * caller should read error.response.data.message.
   *
   * NOTE: request field names are the app's best guess (code + amount/subtotal +
   * product_ids). Adjust here if the backend expects different keys.
   */
  async validateVoucher(
    token: string,
    payload: { code: string; amount: number; productIds?: number[] }
  ): Promise<VoucherValidation> {
    const { code, amount, productIds = [] } = payload
    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/payments/validate-voucher`,
      {
        code: code.trim(),
        amount,
        subtotal: amount,
        product_ids: productIds,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
    return res.data as VoucherValidation
  },
}
