import React from "react"
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { getColors, gradients, radius, spacing, type, shadow } from "../../theme/theme"

type Variant = "primary" | "solid" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: Variant
  size?: Size
  icon?: keyof typeof Ionicons.glyphMap
  iconRight?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  isDarkMode?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZES: Record<Size, { h: number; px: number; font: number; icon: number }> = {
  sm: { h: 38, px: spacing.lg, font: 13, icon: 16 },
  md: { h: 48, px: spacing.xl, font: 15, icon: 18 },
  lg: { h: 54, px: spacing["2xl"], font: 16, icon: 20 },
}

/**
 * App-wide button. `primary` renders the signature sky→cyan gradient; other
 * variants are flat/outline/ghost. Subtle press-scale for tactile feedback,
 * gradient kept on transform/opacity only (no layout animation).
 */
export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  isDarkMode = false,
  style,
}: ButtonProps) {
  const c = getColors(isDarkMode)
  const s = SIZES[size]
  const isDisabled = disabled || loading

  const fg =
    variant === "outline" || variant === "ghost" ? c.primary : c.onPrimary

  const base: ViewStyle = {
    height: s.h,
    paddingHorizontal: s.px,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: fullWidth ? "stretch" : "flex-start",
  }

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon ? <Ionicons name={icon} size={s.icon} color={fg} /> : null}
          <Text style={[styles.label, { color: fg, fontSize: s.font }]}>
            {label}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={s.icon} color={fg} />
          ) : null}
        </View>
      )}
    </>
  )

  // Gradient primary
  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          { alignSelf: fullWidth ? "stretch" : "flex-start" },
          { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: isDisabled ? 0.5 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[base, shadow.md]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    )
  }

  const variantStyle: ViewStyle =
    variant === "solid"
      ? { backgroundColor: c.primary, ...shadow.sm }
      : variant === "danger"
        ? { backgroundColor: c.danger, ...shadow.sm }
        : variant === "outline"
          ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: c.primary }
          : { backgroundColor: c.primarySoft }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        base,
        variantStyle,
        { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontWeight: "700",
  },
})
