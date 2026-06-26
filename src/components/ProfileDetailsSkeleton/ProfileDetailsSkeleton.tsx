import React, { useEffect, useState } from "react"
import { Animated, View, StyleSheet, type ViewStyle } from "react-native"
import styles from "../../styles/ProfileDetailsScreen.styles"

interface Palette {
  bg: string
  card: string
  border: string
  iconBg: string
  track: string
}

interface ProfileDetailsSkeletonProps {
  c: Palette
  insets: { top: number }
  isDarkMode?: boolean
}

/**
 * Loading placeholder for ProfileDetailsScreen. Mirrors the real layout (cover,
 * avatar, name, stat tiles, CTA, info sections) so content fills in without a
 * layout shift, instead of a centered spinner.
 *
 * Reanimated isn't installed in this project, so the shimmer uses the RN
 * `Animated` API with `useNativeDriver: true` on `opacity` only — that runs on
 * the UI thread and never animates layout props (per the perf rules).
 *
 * Box/SkeletonRow/SkeletonSection are declared at module scope (NOT inside the
 * component) so they aren't recreated on every render — recreating a component
 * type remounts its subtree and makes React Compiler bail out of memoizing this
 * file (react-hooks/static-components). The shared `pulse` Animated.Value is
 * threaded in as a prop.
 */

type BoxProps = {
  w: ViewStyle["width"]
  h: number
  r?: number
  color: string
  pulse: Animated.Value
  style?: ViewStyle
}

const Box = ({ w, h, r = 6, color, pulse, style }: BoxProps) => (
  <Animated.View
    style={[
      { width: w, height: h, borderRadius: r, backgroundColor: color, opacity: pulse },
      style,
    ]}
  />
)

const SkeletonRow = ({
  isLast,
  c,
  base,
  pulse,
}: {
  isLast?: boolean
  c: Palette
  base: string
  pulse: Animated.Value
}) => (
  <View style={[styles.row, isLast && styles.rowLast, { borderBottomColor: c.border }]}>
    <View style={styles.rowLeft}>
      <Box w={30} h={30} r={9} color={c.iconBg} pulse={pulse} />
      <Box w={90} h={12} color={base} pulse={pulse} />
    </View>
    <Box w={110} h={12} color={base} pulse={pulse} />
  </View>
)

const SkeletonSection = ({
  rowCount,
  c,
  base,
  pulse,
}: {
  rowCount: number
  c: Palette
  base: string
  pulse: Animated.Value
}) => (
  <View>
    <Box w={80} h={12} color={base} pulse={pulse} style={local.sectionLabel} />
    <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <SkeletonRow key={i} isLast={i === rowCount - 1} c={c} base={base} pulse={pulse} />
      ))}
    </View>
  </View>
)

function ProfileDetailsSkeleton({
  c,
  insets,
  isDarkMode = false,
}: ProfileDetailsSkeletonProps) {
  // Lazy useState (not useRef.current) so the shared Animated.Value is safe to
  // read during render — useRef's `.current` makes React Compiler bail out of
  // memoizing this component (react-hooks/refs).
  const [pulse] = useState(() => new Animated.Value(0.4))
  const base = isDarkMode ? "#334155" : "#e2e8f0"
  const coverBase = isDarkMode ? "#1e293b" : "#cbd5e1"

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Cover banner */}
      <View style={{ backgroundColor: coverBase, paddingTop: insets.top + 6 }}>
        <View style={styles.topBar}>
          <Box w={38} h={38} r={19} color={base} pulse={pulse} />
          <Box w={120} h={14} color={base} pulse={pulse} />
          <Box w={38} h={38} r={19} color={base} pulse={pulse} />
        </View>
        <View style={{ height: 72 }} />
      </View>

      {/* Floating profile sheet */}
      <View style={[styles.profileSheet, { backgroundColor: c.bg }]}>
        <View style={styles.avatarWrap}>
          <Box w={92} h={92} r={46} color={c.iconBg} pulse={pulse} />
        </View>
        <Box w={170} h={20} color={base} pulse={pulse} style={{ marginTop: 4 }} />
        <Box w={100} h={14} color={base} pulse={pulse} style={{ marginTop: 8 }} />
        <Box w={120} h={26} r={20} color={base} pulse={pulse} style={{ marginTop: 12 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Stat tiles */}
        <View style={styles.statRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.statTile, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Box w={30} h={30} r={9} color={c.iconBg} pulse={pulse} />
              <Box w={40} h={14} color={base} pulse={pulse} style={{ marginTop: 4 }} />
              <Box w={50} h={10} color={base} pulse={pulse} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>

        {/* CTA */}
        <Box w="100%" h={48} r={14} color={base} pulse={pulse} style={{ marginBottom: 18 }} />

        {/* Info sections */}
        <SkeletonSection rowCount={6} c={c} base={base} pulse={pulse} />
        <SkeletonSection rowCount={5} c={c} base={base} pulse={pulse} />
      </View>
    </View>
  )
}

const local = StyleSheet.create({
  sectionLabel: {
    marginLeft: 6,
    marginBottom: 8,
  },
})

export default React.memo(ProfileDetailsSkeleton)
