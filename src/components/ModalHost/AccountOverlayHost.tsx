import React from "react"
import { View, StyleSheet } from "react-native"
import { Colors } from "../../constants/colors"
import { useModalStore } from "../../store/modalStore"
import SettingsScreen from "../../screen/SettingsScreen"
import SecurityScreen from "../../screen/SecurityScreen"
import ProfileDetailsScreen from "../../screen/ProfileDetailsScreen"
import ProfileEditScreen from "../../screen/ProfileEditScreen"

interface AccountOverlayHostProps {
  isDarkMode?: boolean
  token?: string | null
  /** The logged-in user (placeholder for details, subject for settings/edit). */
  user?: any
  cartCount?: number
  setIsDarkMode?: (v: boolean) => void
  onLogout?: () => void
  onUserUpdate?: (u: any) => void
  /** Open the cart overlay (still owned by AppNavigator). */
  onOpenCart?: () => void
  /** Bump the linked-accounts refresh trigger after a Google link. */
  onGoogleLinked?: () => void
  /**
   * Perform the profile-update request. Resolves true on success — the host then
   * runs the same back-navigation the old inline handler did (closeProfileEdit).
   * The actual axios PUT + toasts stay in AppNavigator with the other data logic.
   */
  onProfileSave?: (profileData: any) => Promise<boolean>
}

/**
 * Renders the account overlay sub-graph (settings ↔ security ↔ profile details ↔
 * profile edit) whose visibility + transitions live in the Zustand modal store.
 * Subscribing here (not in AppNavigator) means navigating within this cluster
 * re-renders only this host, not the 2.7k-line navigator. The cross-cutting leaf
 * actions are passed in as props so AppNavigator stays their single source of
 * truth.
 */
export default function AccountOverlayHost({
  isDarkMode = false,
  token,
  user,
  cartCount = 0,
  setIsDarkMode,
  onLogout,
  onUserUpdate,
  onOpenCart,
  onGoogleLinked,
  onProfileSave,
}: AccountOverlayHostProps) {
  const settingsOpen = useModalStore((s) => s.settingsOpen)
  const securityOpen = useModalStore((s) => s.securityOpen)
  const profileDetailsOpen = useModalStore((s) => s.profileDetailsOpen)
  const profileEditOpen = useModalStore((s) => s.profileEditOpen)
  const currentProfile = useModalStore((s) => s.currentProfile)

  const closeSettings = useModalStore((s) => s.closeSettings)
  const closeSecurity = useModalStore((s) => s.closeSecurity)
  const closeProfileDetails = useModalStore((s) => s.closeProfileDetails)
  const closeProfileEdit = useModalStore((s) => s.closeProfileEdit)
  const openSecurityFromSettings = useModalStore(
    (s) => s.openSecurityFromSettings
  )
  const openProfileEditFromDetails = useModalStore(
    (s) => s.openProfileEditFromDetails
  )
  const openProfileEditFromSettings = useModalStore(
    (s) => s.openProfileEditFromSettings
  )
  const openInfoPage = useModalStore((s) => s.openInfoPage)
  const openHistory = useModalStore((s) => s.openHistory)

  return (
    <>
      {profileDetailsOpen && (
        <View style={styles.overlay}>
          <ProfileDetailsScreen
            token={token}
            placeholderUser={user}
            cartCount={cartCount}
            isDarkMode={isDarkMode}
            onUserUpdate={onUserUpdate}
            onClose={closeProfileDetails}
            onCartPress={() => {
              closeProfileDetails()
              onOpenCart?.()
            }}
            onEditProfile={(profileData: any) =>
              openProfileEditFromDetails(profileData)
            }
          />
        </View>
      )}

      {profileEditOpen && (
        <View style={styles.overlay}>
          <ProfileEditScreen
            user={currentProfile || user}
            isDarkMode={isDarkMode}
            onBack={closeProfileEdit}
            onSave={async (profileData: any) => {
              const ok = await onProfileSave?.(profileData)
              if (ok) closeProfileEdit()
            }}
          />
        </View>
      )}

      {securityOpen && (
        <View style={styles.overlay}>
          <SecurityScreen
            isDarkMode={isDarkMode}
            token={token}
            onBack={closeSecurity}
            onGoogleLinked={onGoogleLinked}
            onOpenHistory={openHistory}
          />
        </View>
      )}

      {settingsOpen && (
        <View style={styles.overlay}>
          <SettingsScreen
            user={user}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onBack={closeSettings}
            onNavigateSecurity={openSecurityFromSettings}
            onEditProfile={openProfileEditFromSettings}
            onNavigateAboutUs={() => openInfoPage("aboutUs")}
            onNavigatePrivacyPolicy={() => openInfoPage("privacyPolicy")}
            onNavigateTermsAndConditions={() =>
              openInfoPage("termsAndConditions")
            }
            onNavigateIncomeDisclaimer={() => openInfoPage("incomeDisclaimer")}
            onNavigateCookiePolicy={() => openInfoPage("cookiePolicy")}
            onNavigateRewardsAndCommissions={() =>
              openInfoPage("rewardsAndCommissions")
            }
            onNavigateContactUs={() => openInfoPage("contactUs")}
            onNavigateOurBranches={() => openInfoPage("ourBranches")}
            onNavigateFAQs={() => openInfoPage("faqs")}
            onNavigateShippingInfo={() => openInfoPage("shippingInfo")}
            onNavigateReturns={() => openInfoPage("returns")}
            onLogout={onLogout}
          />
        </View>
      )}
    </>
  )
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
