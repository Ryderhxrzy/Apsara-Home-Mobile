import { create } from "zustand"

/**
 * Modal store (Zustand) — holds modal/overlay visibility state migrated out of
 * the AppNavigator god-component. Rendering lives in `ModalHost`, which subscribes
 * here, so opening/closing a migrated modal re-renders only ModalHost instead of
 * the entire AppNavigator tree.
 *
 * First batch: the static "info page" overlays (About Us, Privacy Policy, etc.).
 * They are full-screen overlays opened one-at-a-time from the Settings screen and
 * closed via onBack — verified mutually exclusive — so a single `infoPage` value
 * preserves the exact prior behaviour while keeping the store small.
 */
export type InfoPage =
  | "aboutUs"
  | "privacyPolicy"
  | "termsAndConditions"
  | "incomeDisclaimer"
  | "cookiePolicy"
  | "rewardsAndCommissions"
  | "contactUs"
  | "ourBranches"
  | "faqs"
  | "shippingInfo"
  | "returns"

/** AF Wallet overlays — opened one-at-a-time from the wallet/profile menus. */
export type WalletPage = "overview" | "voucher" | "rewards" | "network"

interface ModalState {
  /** Currently-open info page overlay, or null when none is open. */
  infoPage: InfoPage | null
  openInfoPage: (page: InfoPage) => void
  closeInfoPage: () => void

  /** Currently-open AF Wallet overlay, or null when none is open. */
  walletPage: WalletPage | null
  openWalletPage: (page: WalletPage) => void
  closeWalletPage: () => void

  /** Login/activity History overlay (opened from the Security screen). */
  historyOpen: boolean
  openHistory: () => void
  closeHistory: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  infoPage: null,
  openInfoPage: (page) => set({ infoPage: page }),
  closeInfoPage: () => set({ infoPage: null }),

  walletPage: null,
  openWalletPage: (page) => set({ walletPage: page }),
  closeWalletPage: () => set({ walletPage: null }),

  historyOpen: false,
  openHistory: () => set({ historyOpen: true }),
  closeHistory: () => set({ historyOpen: false }),
}))
