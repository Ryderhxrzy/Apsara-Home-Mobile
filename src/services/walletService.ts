import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// The /encashment/wallet endpoint returns a large set of balance fields.
// These are the ones consumed by the Rewards screen; the index signature
// keeps the type forgiving for fields used by the other wallet screens.
export interface WalletSummary {
  personal_cashback_balance?: number
  personal_cashback_source_balance?: number
  personal_cashback_reserved_balance?: number
  personal_cashback_rate?: number
  affiliate_retail_profit?: number
  affiliate_performance_bonus?: number
  global_purchase_bonus?: number
  group_purchase_bonus?: number
  pending_referral_earnings?: number
  yearly_purchase_pv?: number
  lifetime_pv?: number
  monthly_purchase_points?: number
  total_bonus?: number
  encashment_locked?: number
  encashment_available?: number
  [key: string]: any
}

export interface WalletOverview {
  summary: WalletSummary
  ledger: any[]
}

export interface WalletNetwork {
  summary: WalletSummary
  unilevelAwards: any[]
}

export interface WalletVoucher {
  summary: WalletSummary
  vouchers: any[]
}

export const walletService = {
  /**
   * Fetch the user's wallet payload from /encashment/wallet.
   * Pass walletType (e.g. "all") to request a specific wallet view.
   * Returns the unwrapped payload — callers pick `.summary` if present.
   */
  async getWallet(
    token: string,
    walletType?: string
  ): Promise<WalletSummary> {
    try {
      const response = await api.get("/encashment/wallet", {
        headers: { Authorization: `Bearer ${token}` },
        params: walletType ? { wallet_type: walletType } : undefined,
      })

      const data = response.data?.data || response.data
      return data?.summary || data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load wallet data",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  /**
   * Fetch the wallet payload and return both the summary and the ledger.
   * Used by the Overview screen (which requests wallet_type=all).
   */
  async getWalletWithLedger(
    token: string,
    walletType?: string
  ): Promise<WalletOverview> {
    try {
      const response = await api.get("/encashment/wallet", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          wallet_type: walletType || "all",
          page: 1,
          per_page: 15,
        },
      })

      const data = response.data?.data || response.data
      const summary = data?.summary || data
      const ledger = data?.ledger || []
      return { summary, ledger }
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load wallet data",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  /**
   * Fetch the wallet payload and return the summary plus unilevel awards.
   * Used by the Network Earnings screen.
   */
  async getWalletNetwork(token: string): Promise<WalletNetwork> {
    try {
      const response = await api.get("/encashment/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data?.data || response.data
      const summary = data?.summary || data
      const unilevelAwards = data?.unilevel_awards || []
      return { summary, unilevelAwards }
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load wallet data",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  /**
   * Fetch the wallet payload and return the summary plus affiliate vouchers.
   * Used by the AF Voucher screen.
   */
  async getWalletVoucher(token: string): Promise<WalletVoucher> {
    try {
      const response = await api.get("/encashment/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = response.data?.data || response.data
      const summary = data?.summary || data
      const vouchers = data?.affiliate_vouchers || []
      return { summary, vouchers }
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load wallet data",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },
}
