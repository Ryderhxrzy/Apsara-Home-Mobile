import React from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { BellRing, BellOff, X } from "lucide-react-native"
import { Colors } from "../../constants/colors"

export type FollowNotifyMode = "enabled" | "blocked"

interface FollowNotifyModalProps {
  visible: boolean
  /** "enabled" = friendly heads-up; "blocked" = nudge to allow notifications. */
  mode: FollowNotifyMode | null
  brandName?: string
  isDarkMode?: boolean
  onClose: () => void
  /** Only used in "blocked" mode — request permission / open settings. */
  onEnable: () => void
}

const AMBER = "#f59e0b"
const AMBER_SOFT = "rgba(245,158,11,0.12)"
const SKY_SOFT = "rgba(14,165,233,0.12)"

/**
 * Friendly post-follow sheet. After a user follows a brand we let them know —
 * in a warm, non-cancellable-feeling way — that they'll get the brand's push
 * notifications (opt-in is the default, never a yes/no prompt). If the device
 * has notifications turned off, it instead nudges them to enable.
 */
function FollowNotifyModal({
  visible,
  mode,
  brandName,
  isDarkMode = false,
  onClose,
  onEnable,
}: FollowNotifyModalProps) {
  const brand = brandName?.trim() || "this brand"
  const isBlocked = mode === "blocked"

  const c = {
    sheet: isDarkMode ? "#111827" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    sub: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    closeBg: isDarkMode ? "#1f2937" : "#f1f5f9",
  }

  const accent = isBlocked ? AMBER : Colors.sky
  const accentSoft = isBlocked ? AMBER_SOFT : SKY_SOFT

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Absorb taps on the sheet so they don't close the modal. */}
        <Pressable
          style={[styles.sheet, { backgroundColor: c.sheet }]}
          onPress={() => {}}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[styles.close, { backgroundColor: c.closeBg }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={c.sub} />
          </Pressable>

          <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
            {isBlocked ? (
              <BellOff size={30} color={accent} />
            ) : (
              <BellRing size={30} color={accent} />
            )}
          </View>

          <Text style={[styles.title, { color: c.text }]}>
            {isBlocked
              ? "Stay in the loop 🔔"
              : `You're following ${brand}! 🎉`}
          </Text>

          <Text style={[styles.body, { color: c.sub }]}>
            {isBlocked
              ? `Turn on notifications so you never miss ${brand}'s exclusive drops, deals, and updates.`
              : `You'll now get ${brand}'s newest drops, deals, and updates as push notifications — right here, no need to check back.`}
          </Text>

          {isBlocked ? (
            <>
              <Pressable
                onPress={onEnable}
                style={[styles.primaryBtn, { backgroundColor: accent }]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Enable Notifications</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={styles.secondaryBtn}
                hitSlop={6}
              >
                <Text style={[styles.secondaryBtnText, { color: c.sub }]}>
                  Maybe later
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={onClose}
              style={[styles.primaryBtn, { backgroundColor: accent }]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Got it</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
})

export default React.memo(FollowNotifyModal)
