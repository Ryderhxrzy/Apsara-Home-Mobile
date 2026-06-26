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

export interface ReferralOtpData {
  phone: string
  verificationToken: string
}

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

  /**
   * Customer-support chat overlay (opened from the floating ChatSupportFab).
   * Fully self-contained — it only needs token/user/isDarkMode and closes itself —
   * so it lives here and renders in ModalHost. Toggling it no longer re-renders
   * the AppNavigator god-component.
   */
  chatSupportOpen: boolean
  openChatSupport: () => void
  closeChatSupport: () => void

  /**
   * PV Earner overlay (opened from the Profile screen). Its product-press / shop
   * nav callbacks are passed into ModalHost as props from AppNavigator, so only
   * the visibility boolean lives here.
   */
  pvEarnerOpen: boolean
  openPVEarner: () => void
  closePVEarner: () => void

  /**
   * Referral network overlay (opened from Profile and the affiliate modal). The
   * referral tree data stays in AppNavigator (it's shared with
   * AffiliateReferralModal) and is passed to ModalHost as a prop; only the
   * visibility boolean lives here.
   */
  referralNetworkOpen: boolean
  openReferralNetwork: () => void
  closeReferralNetwork: () => void

  /**
   * Account overlays — settings ↔ security ↔ profile details ↔ profile edit.
   * This was a tightly-coupled boolean state-machine inside AppNavigator; the
   * transition actions below replicate its exact behaviour (where "back" returns
   * to depends on where you came from). Rendered by AccountOverlayHost; the leaf
   * couplings (cart, dark mode, logout, linked-accounts, the profile-save
   * request) are passed into that host as props from AppNavigator.
   */
  settingsOpen: boolean
  securityOpen: boolean
  profileDetailsOpen: boolean
  profileEditOpen: boolean
  /** Profile data captured when opening edit from the profile-details screen. */
  currentProfile: any
  /** Return-target flags (mirror the old previousScreenFromSecurity /
   *  editProfileFromSettings booleans). */
  securityCameFromSettings: boolean
  editProfileCameFromSettings: boolean

  openSettings: () => void
  closeSettings: () => void
  /** Security opened from the Profile screen (back just closes). */
  openSecurity: () => void
  /** Security opened from Settings (back returns to Settings). */
  openSecurityFromSettings: () => void
  closeSecurity: () => void
  openProfileDetails: () => void
  closeProfileDetails: () => void
  /** Edit opened from profile details (back/save returns to details). */
  openProfileEditFromDetails: (profile: any) => void
  /** Edit opened from Settings (back/save returns to Settings). */
  openProfileEditFromSettings: () => void
  closeProfileEdit: () => void

  /**
   * Referral signup flow (deep-link → intro → signup → OTP). The step booleans
   * stack exactly like the originals (e.g. signup opens on top of intro). The
   * shared deep-link data (referralCode/referrerProfile) stays in AppNavigator
   * and is passed into ReferralSignupFlow as props.
   */
  referralIntroOpen: boolean
  referralSignupOpen: boolean
  referralOtpOpen: boolean
  referralOtpData: ReferralOtpData | null
  openReferralIntro: () => void
  openReferralSignup: () => void
  closeReferralSignup: () => void
  openReferralOtp: (data: ReferralOtpData) => void
  closeReferralOtp: () => void
  resetReferralFlow: () => void
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

  chatSupportOpen: false,
  openChatSupport: () => set({ chatSupportOpen: true }),
  closeChatSupport: () => set({ chatSupportOpen: false }),

  pvEarnerOpen: false,
  openPVEarner: () => set({ pvEarnerOpen: true }),
  closePVEarner: () => set({ pvEarnerOpen: false }),

  referralNetworkOpen: false,
  openReferralNetwork: () => set({ referralNetworkOpen: true }),
  closeReferralNetwork: () => set({ referralNetworkOpen: false }),

  settingsOpen: false,
  securityOpen: false,
  profileDetailsOpen: false,
  profileEditOpen: false,
  currentProfile: null,
  securityCameFromSettings: false,
  editProfileCameFromSettings: false,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openSecurity: () =>
    set({ securityOpen: true, securityCameFromSettings: false }),
  openSecurityFromSettings: () =>
    set({
      securityOpen: true,
      settingsOpen: false,
      securityCameFromSettings: true,
    }),
  closeSecurity: () =>
    set((s) =>
      s.securityCameFromSettings
        ? {
            securityOpen: false,
            settingsOpen: true,
            securityCameFromSettings: false,
          }
        : { securityOpen: false }
    ),
  openProfileDetails: () => set({ profileDetailsOpen: true }),
  closeProfileDetails: () => set({ profileDetailsOpen: false }),
  openProfileEditFromDetails: (profile) =>
    set({
      currentProfile: profile,
      profileDetailsOpen: false,
      profileEditOpen: true,
      editProfileCameFromSettings: false,
    }),
  openProfileEditFromSettings: () =>
    set({
      settingsOpen: false,
      profileEditOpen: true,
      editProfileCameFromSettings: true,
    }),
  closeProfileEdit: () =>
    set((s) =>
      s.editProfileCameFromSettings
        ? {
            profileEditOpen: false,
            settingsOpen: true,
            editProfileCameFromSettings: false,
          }
        : { profileEditOpen: false, profileDetailsOpen: true }
    ),

  referralIntroOpen: false,
  referralSignupOpen: false,
  referralOtpOpen: false,
  referralOtpData: null,
  openReferralIntro: () => set({ referralIntroOpen: true }),
  // Signup opens on top of intro (intro stays mounted underneath, as before).
  openReferralSignup: () => set({ referralSignupOpen: true }),
  closeReferralSignup: () => set({ referralSignupOpen: false }),
  openReferralOtp: (data) =>
    set({
      referralSignupOpen: false,
      referralOtpData: data,
      referralOtpOpen: true,
    }),
  // OTP back → returns to signup, clears OTP data.
  closeReferralOtp: () =>
    set({
      referralOtpOpen: false,
      referralOtpData: null,
      referralSignupOpen: true,
    }),
  // Full reset (intro close / OTP success) — clears every step + OTP data.
  resetReferralFlow: () =>
    set({
      referralIntroOpen: false,
      referralSignupOpen: false,
      referralOtpOpen: false,
      referralOtpData: null,
    }),
}))
