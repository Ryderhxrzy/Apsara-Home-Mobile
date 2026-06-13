---
name: design-system-redesign
description: AF Home is being redesigned to a premium Shopee-style look on a new centralized theme system
metadata:
  type: project
---

A full UI redesign of AF Home is in progress (started 2026-06-13), one screen at a time, keeping the existing color scheme.

A centralized design-token system was introduced at `src/theme/theme.ts` — the RN equivalent of the website's Tailwind theme: Slate neutral spine, Sky primary, Emerald/Teal/Amber/Red semantics, cream/forest/brass brand. Exposes `getColors(isDarkMode)` plus `spacing`, `radius`, `type`, `shadow`, `gradients`.

**How to apply:** New/redesigned screens should use `const c = getColors(isDarkMode)` instead of hand-rolling a local `colors` object, and pull spacing/radius/type/shadow from the theme. Reusable primitives live in `src/components/ui/` (Card, SectionHeader, Button). The legacy flat `Colors` export in `src/constants/colors.ts` is kept for the ~50 not-yet-redesigned screens — do not delete it.

**Why:** The app had no theme system — every screen hardcoded spacing/type and rebuilt a `colors` object inline from the prop-threaded `isDarkMode` (there is no theme context). The new system centralizes this without a risky context refactor.

Done so far: theme + primitives; HomeScreen (structural — gradient membership hero with glass stat strip, SectionHeader, borderless room tiles); CartScreen (token pass); AppHeader (structural — gradient app bar + white search pill + frosted chips, replacing the old remote bg image; lifts Home/Shop/Search/ProductDetail). ProfileScreen (structural — gradient header replacing the remote bg image, theme palette, rounded section cards with soft shadows, sky-soft icon backgrounds). ProfileDetailsScreen (consistency + depth pass — theme palette, cover gradient matched to the app header, card shadows, sky badge chip). The membership hero uses `gradients.membership` (deep sky), NOT the forest `brand` gradient — the app/website scheme is slate + sky blue; forest green is marketing-only.

Caution: do NOT pull a ScrollView over a fixed gradient header with negative `marginTop` to fake a "floating card" overlap — it makes ALL scrolled cards clip through the header band, not just the first. Use a flat header boundary instead (tried and reverted on ProfileScreen).

Done: Home, Cart, AppHeader, Profile, Profile Details, Leaderboard (full redesign — podium + ranked rows with score blocks, on-brand sky gradient), and theme-consistency passes on the remaining bottom tabs (Wishlist, Notifications, Shop). Shop uses the redesigned AppHeader so it gets the gradient header for free.

Pattern for remaining screens (Checkout, Settings, Search, Wallet screens, etc.): route the local `colors` object through `getColors(isDarkMode)` keeping the same keys; in the styles file import `palette, radius, shadow` and swap hardcoded page bg → `palette.slate50`, round primary buttons → `radius.lg` + `shadow.sm`, give title/toolbar headers `shadow.sm`. Screens with a title hero can take a sky gradient header (`gradients.primary` light / slate dark) like Home/Profile; functional toolbars stay solid. Note React Compiler is enabled (app.json) — do NOT add manual `useMemo`/`useCallback`/`memo`. See [[react-compiler-enabled]].
