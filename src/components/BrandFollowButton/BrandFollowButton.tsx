import React from "react"
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native"
import Ionicons from "../ui/Icon"
import { Colors } from "../../constants/colors"
import { useBrandFollow } from "../../hooks/query/useBrandFollow"

interface BrandFollowButtonProps {
  token?: string | null
  brandId: number
  isDarkMode?: boolean
  /** Circular icon-only toggle (for compact cards). Otherwise a labelled pill. */
  compact?: boolean
  /** Extra style for the root — used by the card to position it absolutely. */
  style?: ViewStyle | ViewStyle[]
}

/**
 * Optimistic Follow / Following toggle for a brand. State comes from the shared
 * `["following"]` set via useBrandFollow, so this stays in sync with the brand
 * detail screen and every other instance. Hidden for guests (no token).
 */
function BrandFollowButton({
  token,
  brandId,
  isDarkMode = false,
  compact = false,
  style,
}: BrandFollowButtonProps) {
  const { isFollowing, isToggling, toggleFollow } = useBrandFollow({
    token,
    brandId,
    withCount: false,
  })

  // Guests can't follow — the endpoints 401 without a token.
  if (!token) return null

  const followingBg = isDarkMode ? "rgba(14,165,233,0.18)" : "#e0f2fe"
  const idleBg = isDarkMode ? "#1f2937" : Colors.white

  const onPress = () => {
    if (isToggling) return
    toggleFollow()
  }

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? "Following brand" : "Follow brand"}
        style={[
          styles.iconButton,
          { backgroundColor: isFollowing ? Colors.sky : idleBg },
          style as ViewStyle,
        ]}
      >
        <Ionicons
          name={isFollowing ? "checkmark" : "add"}
          size={16}
          color={isFollowing ? Colors.white : Colors.sky}
        />
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? "Following brand" : "Follow brand"}
      style={[
        styles.pill,
        { backgroundColor: isFollowing ? followingBg : Colors.sky },
        style as ViewStyle,
      ]}
    >
      <Ionicons
        name={isFollowing ? "checkmark" : "add"}
        size={14}
        color={isFollowing ? Colors.sky : Colors.white}
      />
      <View style={styles.pillTextWrap}>
        <Text
          style={[
            styles.pillText,
            { color: isFollowing ? Colors.sky : Colors.white },
          ]}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillTextWrap: {
    justifyContent: "center",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
  },
})

export default React.memo(BrandFollowButton)
