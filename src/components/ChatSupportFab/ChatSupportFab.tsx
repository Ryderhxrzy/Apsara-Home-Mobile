import React from "react"
import { Pressable, StyleSheet } from "react-native"
import Icon from "../ui/Icon"
import { Colors } from "../../constants/colors"

interface ChatSupportFabProps {
  onPress: () => void
  /** Distance from the screen bottom — set so it clears the tab bar. */
  bottom: number
  isDarkMode?: boolean
}

/**
 * Floating chat-support button. Sits bottom-right above the tab bar and opens
 * the customer-support chat. Rendered once by TabNavigator so it appears on
 * every tab; full-screen overlays (cart, checkout, the chat itself) paint over
 * it because they mount above the navigator.
 */
export default function ChatSupportFab({
  onPress,
  bottom,
  isDarkMode = false,
}: ChatSupportFabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Chat with support"
      hitSlop={8}
      style={({ pressed }) => [
        styles.fab,
        isDarkMode && styles.fabDark,
        { bottom },
        pressed && styles.fabPressed,
      ]}
    >
      <Icon name="chatbubble-ellipses" size={26} color={Colors.white} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    // Soft floating shadow (iOS) + elevation (Android).
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDark: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
})
