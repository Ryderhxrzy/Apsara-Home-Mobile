import React from "react"
import { View, ViewStyle, StyleProp } from "react-native"
import { getColors, radius, spacing, shadow } from "../../theme/theme"

interface CardProps {
  children: React.ReactNode
  isDarkMode?: boolean
  /** Visual weight. "flat" = border only, "raised" = soft shadow. */
  elevation?: "flat" | "sm" | "md" | "lg"
  padded?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Themed surface used across the redesign. Border + optional soft shadow,
 * rounded corners, theme-aware background. Keeps cards visually consistent
 * instead of each screen re-declaring its own panel styles.
 */
export default function Card({
  children,
  isDarkMode = false,
  elevation = "sm",
  padded = true,
  style,
}: CardProps) {
  const c = getColors(isDarkMode)
  const elevStyle =
    elevation === "flat"
      ? shadow.none
      : elevation === "lg"
        ? shadow.lg
        : elevation === "md"
          ? shadow.md
          : shadow.sm

  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          padding: padded ? spacing.lg : 0,
        },
        elevStyle,
        style,
      ]}
    >
      {children}
    </View>
  )
}
