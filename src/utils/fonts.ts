import React from "react"
import type { TextStyle } from "react-native"

/**
 * Plus Jakarta Sans font family names.
 * These keys match the variants exported by
 * `@expo-google-fonts/plus-jakarta-sans` and embedded via `useFonts`.
 */
export const Fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
} as const

/**
 * Maps a React Native `fontWeight` to the matching Plus Jakarta Sans variant.
 * Defaults to the regular weight when no weight is provided.
 */
function fontForWeight(weight?: TextStyle["fontWeight"]): string {
  switch (String(weight)) {
    case "500":
      return Fonts.medium
    case "600":
      return Fonts.semiBold
    case "700":
    case "bold":
      return Fonts.bold
    case "800":
    case "900":
      return Fonts.extraBold
    default:
      return Fonts.regular
  }
}

/**
 * Flattens a style prop (object | array | falsy) to read its `fontWeight`.
 */
function readFontWeight(style: any): TextStyle["fontWeight"] | undefined {
  if (!style) return undefined
  if (Array.isArray(style)) {
    for (let i = style.length - 1; i >= 0; i--) {
      const w = readFontWeight(style[i])
      if (w) return w
    }
    return undefined
  }
  return style.fontWeight
}

/**
 * Wraps a host component (Text / TextInput) so it injects a default
 * Plus Jakarta Sans `fontFamily` based on the element's `fontWeight`.
 * The default is placed first in the style array, so any explicit
 * `fontFamily` set by a screen still wins.
 */
function withDefaultFont(Original: any) {
  const Wrapped = (props: any) => {
    const weight = readFontWeight(props?.style)
    const fontStyle = { fontFamily: fontForWeight(weight) }
    return React.createElement(Original, {
      ...props,
      style: props?.style ? [fontStyle, props.style] : fontStyle,
    })
  }

  Wrapped.displayName = `Font(${Original?.displayName || Original?.name || "Component"})`

  // Preserve static members (e.g. TextInput.State) so callers keep working.
  for (const key of Object.keys(Original)) {
    try {
      ;(Wrapped as any)[key] = Original[key]
    } catch {
      // some statics are read-only — safe to skip
    }
  }

  return Wrapped
}

let installed = false

/**
 * Makes every `Text` / `TextInput` in the app default to Plus Jakarta Sans
 * without editing each screen.
 *
 * In React Native 0.85 (React 19) `Text` is a plain function component, so the
 * old `Text.render` monkey-patch no longer applies. Instead we replace the
 * `Text` / `TextInput` getters on the `react-native` module export with wrapper
 * components. Because Babel compiles `<Text>` usages to a `react-native.Text`
 * property read at render time, every screen picks up the wrapper.
 *
 * Note: screens that import via `import * as RN from "react-native"` receive a
 * frozen namespace copy and are not affected (none currently do this).
 */
export function setupGlobalFont(): void {
  if (installed) return
  installed = true

  // Use require (not `import * as`) so we get the mutable CommonJS exports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require("react-native")

  for (const name of ["Text", "TextInput"] as const) {
    const Original = RN[name]
    if (!Original) continue
    const descriptor = Object.getOwnPropertyDescriptor(RN, name)
    if (descriptor && descriptor.configurable === false) continue
    Object.defineProperty(RN, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: withDefaultFont(Original),
    })
  }
}
