import { Platform, ViewStyle } from "react-native"

/**
 * Centralized design tokens for AF Home — the React Native equivalent of the
 * website's Tailwind theme. The neutral spine is the Slate scale; the primary
 * accent is Sky blue; brand layer is cream / forest / brass. Light is default,
 * dark is opt-in (driven by the `isDarkMode` prop the app already threads).
 *
 * Usage in a screen/component:
 *   import { getColors, spacing, radius, type, shadow, gradients } from "../theme/theme"
 *   const c = getColors(isDarkMode)
 *   ...style={{ backgroundColor: c.card, padding: spacing.lg, borderRadius: radius.lg }}
 */

// ---------------------------------------------------------------------------
// Raw palette (kept close to Tailwind's named scales)
// ---------------------------------------------------------------------------
export const palette = {
  white: "#ffffff",
  black: "#000000",

  // Slate (neutral spine)
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  slate950: "#020617",

  // Sky (primary accent)
  sky400: "#38bdf8",
  sky500: "#0ea5e9",
  sky600: "#0284c7",
  sky700: "#0369a1",

  // Cyan / Teal (secondary accent)
  cyan400: "#22d3ee",
  cyan500: "#06b6d4",
  teal400: "#2dd4bf",
  teal500: "#14b8a6",
  teal600: "#0d9488",

  // Emerald (success)
  emerald50: "#ecfdf5",
  emerald400: "#34d399",
  emerald500: "#10b981",
  emerald600: "#059669",

  // Amber (warning)
  amber50: "#fffbeb",
  amber400: "#fbbf24",
  amber500: "#f59e0b",
  amber600: "#d97706",

  // Red / Rose (error / sale)
  red50: "#fef2f2",
  red400: "#f87171",
  red500: "#ef4444",
  red600: "#dc2626",
  rose500: "#f43f5e",

  // Violet / Indigo (premium)
  violet500: "#8b5cf6",
  violet600: "#7c3aed",
  indigo600: "#4f46e5",

  // Brand layer (marketing surfaces)
  cream: "#faf8f5",
  forest: "#2c5f4f",
  forestDark: "#1e4236",
  brass: "#d4a574",
  brassLight: "#e8c4a0",
}

// ---------------------------------------------------------------------------
// Semantic colors — resolved per theme. Shape is identical light/dark so
// components can rely on every key existing.
// ---------------------------------------------------------------------------
export interface ThemeColors {
  // Surfaces
  bg: string // screen background
  bgSubtle: string // slightly raised page area / alt sections
  card: string // card / panel
  cardRaised: string // elevated card (modals, sheets)
  surface: string // chips, inputs, soft fills
  overlay: string // scrim behind modals

  // Text
  text: string
  textSecondary: string
  textMuted: string
  inverse: string // text on colored/primary backgrounds

  // Lines
  border: string
  borderStrong: string
  divider: string

  // Primary (sky)
  primary: string
  primaryDark: string
  primarySoft: string // tinted background for primary
  onPrimary: string

  // Semantic
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  danger: string
  dangerSoft: string

  // Accents
  teal: string
  cyan: string
  violet: string
  amber: string

  // Brand
  forest: string
  brass: string
  cream: string

  // Misc
  star: string // rating gold
  skeleton: string
}

const light: ThemeColors = {
  bg: palette.white,
  bgSubtle: palette.slate50,
  card: palette.white,
  cardRaised: palette.white,
  surface: palette.slate100,
  overlay: "rgba(15, 23, 42, 0.55)",

  text: palette.slate900,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  inverse: palette.white,

  border: palette.slate200,
  borderStrong: palette.slate300,
  divider: palette.slate100,

  primary: palette.sky500,
  primaryDark: palette.sky600,
  primarySoft: "#e0f2fe", // sky-100
  onPrimary: palette.white,

  success: palette.emerald500,
  successSoft: palette.emerald50,
  warning: palette.amber500,
  warningSoft: palette.amber50,
  danger: palette.red500,
  dangerSoft: palette.red50,

  teal: palette.teal500,
  cyan: palette.cyan500,
  violet: palette.violet500,
  amber: palette.amber500,

  forest: palette.forest,
  brass: palette.brass,
  cream: palette.cream,

  star: palette.amber400,
  skeleton: palette.slate200,
}

const dark: ThemeColors = {
  bg: palette.slate900,
  bgSubtle: palette.slate950,
  card: palette.slate800,
  cardRaised: palette.slate800,
  surface: palette.slate700,
  overlay: "rgba(2, 6, 23, 0.7)",

  text: palette.slate100,
  textSecondary: palette.slate400,
  textMuted: palette.slate500,
  inverse: palette.white,

  border: palette.slate700,
  borderStrong: palette.slate600,
  divider: palette.slate800,

  primary: palette.sky500,
  primaryDark: palette.sky600,
  primarySoft: "rgba(14, 165, 233, 0.15)",
  onPrimary: palette.white,

  success: palette.emerald400,
  successSoft: "rgba(16, 185, 129, 0.15)",
  warning: palette.amber400,
  warningSoft: "rgba(245, 158, 11, 0.15)",
  danger: palette.red400,
  dangerSoft: "rgba(239, 68, 68, 0.15)",

  teal: palette.teal400,
  cyan: palette.cyan400,
  violet: palette.violet500,
  amber: palette.amber400,

  forest: palette.forest,
  brass: palette.brass,
  cream: palette.cream,

  star: palette.amber400,
  skeleton: palette.slate700,
}

/** Resolve the semantic color set for the current mode. */
export const getColors = (isDarkMode?: boolean): ThemeColors =>
  isDarkMode ? dark : light

export const themeColors = { light, dark }

// ---------------------------------------------------------------------------
// Spacing (4pt grid)
// ---------------------------------------------------------------------------
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
}

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  "3xl": 30,
  full: 9999,
}

// ---------------------------------------------------------------------------
// Typography — fontSize + lineHeight + weight presets. Spread into a Text
// style: <Text style={[type.h2, { color: c.text }]}>
// ---------------------------------------------------------------------------
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800" as const },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: "800" as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: "700" as const },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "700" as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
  overline: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
  price: { fontSize: 20, lineHeight: 24, fontWeight: "800" as const },
  priceLg: { fontSize: 28, lineHeight: 32, fontWeight: "800" as const },
}

// ---------------------------------------------------------------------------
// Shadows — cross-platform elevation. Tinted slightly toward slate for a
// softer, more premium feel than pure black.
// ---------------------------------------------------------------------------
const SHADOW_COLOR = "#0f172a"

const makeShadow = (
  height: number,
  radiusPx: number,
  opacity: number,
  elevation: number
): ViewStyle =>
  Platform.OS === "android"
    ? { elevation, shadowColor: SHADOW_COLOR }
    : {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height },
        shadowOpacity: opacity,
        shadowRadius: radiusPx,
      }

export const shadow = {
  none: {} as ViewStyle,
  sm: makeShadow(1, 3, 0.06, 2),
  md: makeShadow(3, 8, 0.08, 4),
  lg: makeShadow(8, 18, 0.12, 8),
  xl: makeShadow(14, 28, 0.16, 12),
}

// ---------------------------------------------------------------------------
// Signature gradients (sky→cyan hero/CTA, emerald→teal success, premium violet)
// Use with expo-linear-gradient: <LinearGradient colors={gradients.primary} .../>
// ---------------------------------------------------------------------------
export const gradients = {
  primary: [palette.sky500, palette.cyan500] as const,
  primarySoft: ["#e0f2fe", "#cffafe"] as const,
  // Deep sky → bright sky. The on-scheme hero/membership-card look, matching the
  // website's slate + sky blue identity (NOT the forest "brand" gradient, which
  // is for marketing surfaces only).
  membership: ["#0c4a6e", palette.sky600] as const,
  success: [palette.emerald400, palette.teal500] as const,
  premium: [palette.violet500, palette.indigo600] as const,
  sunset: [palette.amber400, palette.red500] as const,
  brand: [palette.forest, palette.forestDark] as const,
  brass: [palette.brass, palette.brassLight] as const,
  // Image scrims
  scrimBottom: ["transparent", "rgba(15,23,42,0.75)"] as const,
  scrimTop: ["rgba(15,23,42,0.55)", "transparent"] as const,
}

export const hairline = Platform.select({ ios: 0.5, default: 1 }) as number
