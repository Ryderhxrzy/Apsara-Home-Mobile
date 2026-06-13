import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { getColors, spacing, type } from "../../theme/theme"

interface SectionHeaderProps {
  title: string
  /** Small uppercase eyebrow above the title (optional). */
  eyebrow?: string
  /** Ionicons name rendered in a tinted square before the title. */
  icon?: keyof typeof Ionicons.glyphMap
  actionLabel?: string
  onAction?: () => void
  isDarkMode?: boolean
}

/**
 * Consistent section title used across screens: optional accent icon chip,
 * optional eyebrow, and a "See all →" action on the right. Replaces the
 * one-off header rows each screen used to hand-roll.
 */
export default function SectionHeader({
  title,
  eyebrow,
  icon,
  actionLabel = "See all",
  onAction,
  isDarkMode = false,
}: SectionHeaderProps) {
  const c = getColors(isDarkMode)

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? (
          <View style={[styles.iconChip, { backgroundColor: c.primarySoft }]}>
            <Ionicons name={icon} size={16} color={c.primary} />
          </View>
        ) : (
          <View style={[styles.accentBar, { backgroundColor: c.primary }]} />
        )}
        <View style={styles.titles}>
          {eyebrow ? (
            <Text style={[type.overline, { color: c.primary }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[type.h3, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      {onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[type.label, { color: c.primary }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={c.primary} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  accentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: spacing.sm,
  },
})
