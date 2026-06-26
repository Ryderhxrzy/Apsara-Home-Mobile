import React from "react"
import { View, StyleSheet } from "react-native"
import { Colors } from "../../constants/colors"
import {
  useModalStore,
  type InfoPage,
  type WalletPage,
} from "../../store/modalStore"
import AboutUsScreen from "../../screen/AboutUsScreen"
import PrivacyPolicyScreen from "../../screen/PrivacyPolicyScreen"
import TermsAndConditionsScreen from "../../screen/TermsAndConditionsScreen"
import IncomeDisclaimerScreen from "../../screen/IncomeDisclaimerScreen"
import CookiePolicyScreen from "../../screen/CookiePolicyScreen"
import RewardsAndCommissionsScreen from "../../screen/RewardsAndCommissionsScreen"
import ContactUsScreen from "../../screen/ContactUsScreen"
import OurBranchesScreen from "../../screen/OurBranchesScreen"
import FAQsScreen from "../../screen/FAQsScreen"
import ShippingInfoScreen from "../../screen/ShippingInfoScreen"
import ReturnsScreen from "../../screen/ReturnsScreen"
import AFWalletOverviewScreen from "../../screen/AFWalletOverviewScreen"
import AFWalletVoucherScreen from "../../screen/AFWalletVoucherScreen"
import AFWalletRewardsScreen from "../../screen/AFWalletRewardsScreen"
import AFWalletNetworkScreen from "../../screen/AFWalletNetworkScreen"
import HistoryScreen from "../../screen/HistoryScreen"
import ChatSupportScreen from "../../screen/ChatSupportScreen"
import PVEarnerScreen from "../../screen/PVEarnerScreen"
import ReferralNetworkScreen from "../../screen/ReferralNetworkScreen"

interface ModalHostProps {
  isDarkMode?: boolean
  token?: string | null
  user?: { id?: string | number; name?: string; avatar_url?: string } | null
  /** Shared data + nav callbacks for the coupled overlays (PV Earner / Referral
   *  Network). Their visibility lives in the store; their cross-screen wiring is
   *  passed down from AppNavigator so it stays the single source of truth. */
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onPVEarnerProductPress?: (id: number) => void
  onPVEarnerShopPress?: () => void
  referralTree?: any
}

// Map each info page to its screen component. All info screens share the same
// `{ isDarkMode, onBack }` contract, so one lookup table renders them uniformly.
const INFO_PAGES: Record<
  InfoPage,
  React.ComponentType<{ isDarkMode?: boolean; onBack: () => void }>
> = {
  aboutUs: AboutUsScreen,
  privacyPolicy: PrivacyPolicyScreen,
  termsAndConditions: TermsAndConditionsScreen,
  incomeDisclaimer: IncomeDisclaimerScreen,
  cookiePolicy: CookiePolicyScreen,
  rewardsAndCommissions: RewardsAndCommissionsScreen,
  contactUs: ContactUsScreen,
  ourBranches: OurBranchesScreen,
  faqs: FAQsScreen,
  shippingInfo: ShippingInfoScreen,
  returns: ReturnsScreen,
}

// AF Wallet overlays share a `{ isDarkMode, token, onClose }` contract.
const WALLET_PAGES: Record<
  WalletPage,
  React.ComponentType<{
    isDarkMode?: boolean
    token?: string | null
    onClose: () => void
  }>
> = {
  overview: AFWalletOverviewScreen,
  voucher: AFWalletVoucherScreen,
  rewards: AFWalletRewardsScreen,
  network: AFWalletNetworkScreen,
}

/**
 * Renders modal/overlay screens whose visibility lives in the Zustand modal store.
 * Subscribing here (not in AppNavigator) means opening/closing these overlays
 * re-renders only ModalHost, not the whole navigator tree.
 */
export default function ModalHost({
  isDarkMode = false,
  token,
  user,
  wishlistItems,
  onWishlistChange,
  onPVEarnerProductPress,
  onPVEarnerShopPress,
  referralTree,
}: ModalHostProps) {
  const infoPage = useModalStore((s) => s.infoPage)
  const closeInfoPage = useModalStore((s) => s.closeInfoPage)
  const walletPage = useModalStore((s) => s.walletPage)
  const closeWalletPage = useModalStore((s) => s.closeWalletPage)
  const historyOpen = useModalStore((s) => s.historyOpen)
  const closeHistory = useModalStore((s) => s.closeHistory)
  const chatSupportOpen = useModalStore((s) => s.chatSupportOpen)
  const closeChatSupport = useModalStore((s) => s.closeChatSupport)
  const pvEarnerOpen = useModalStore((s) => s.pvEarnerOpen)
  const closePVEarner = useModalStore((s) => s.closePVEarner)
  const referralNetworkOpen = useModalStore((s) => s.referralNetworkOpen)
  const closeReferralNetwork = useModalStore((s) => s.closeReferralNetwork)

  if (infoPage) {
    const Screen = INFO_PAGES[infoPage]
    return (
      <View style={styles.overlay}>
        <Screen isDarkMode={isDarkMode} onBack={closeInfoPage} />
      </View>
    )
  }

  if (walletPage) {
    const Screen = WALLET_PAGES[walletPage]
    return (
      <View style={styles.overlay}>
        <Screen
          isDarkMode={isDarkMode}
          token={token}
          onClose={closeWalletPage}
        />
      </View>
    )
  }

  if (historyOpen) {
    return (
      <View style={styles.overlay}>
        <HistoryScreen
          isDarkMode={isDarkMode}
          token={token}
          onBack={closeHistory}
        />
      </View>
    )
  }

  if (chatSupportOpen) {
    return (
      <View style={styles.overlay}>
        <ChatSupportScreen
          isDarkMode={isDarkMode}
          token={token}
          user={user}
          onBack={closeChatSupport}
        />
      </View>
    )
  }

  if (pvEarnerOpen) {
    return (
      <View style={styles.overlay}>
        <PVEarnerScreen
          isDarkMode={isDarkMode}
          token={token}
          wishlistItems={wishlistItems}
          onWishlistChange={onWishlistChange}
          onBack={closePVEarner}
          onProductPress={(id: number) => {
            closePVEarner()
            onPVEarnerProductPress?.(id)
          }}
          onShopPress={() => {
            closePVEarner()
            onPVEarnerShopPress?.()
          }}
        />
      </View>
    )
  }

  if (referralNetworkOpen) {
    return (
      <View style={styles.overlay}>
        <ReferralNetworkScreen
          token={token}
          tree={referralTree}
          isDarkMode={isDarkMode}
          onBack={closeReferralNetwork}
        />
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  // Mirrors AppNavigator's `cartScreenOverlay` so these overlays look identical.
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },
})
