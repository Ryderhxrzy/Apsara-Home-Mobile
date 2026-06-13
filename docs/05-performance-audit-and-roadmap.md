# Performance Audit & Shopee-Grade Improvement Roadmap

> **Audited:** 2026-06-10 · **Scope:** `src/` (53 screens, 17 components, navigation, hooks, services)
> **Goal:** ship a fast, Shopee-like experience and stop performance/re-render regressions before they compound.
> This document supersedes the rough notes in `docs/audit.md`.

## How to read this

Severity = user-facing/regression impact. Effort = **S** (hours) · **M** (1–2 days) · **L** (multi-day / architectural).
Every finding has `file:line` evidence. "Fix first" items are called out at the end of each section.

---

## 0. Executive summary

The app has a **good foundation** — Hermes + R8 are on, `expo-image` is used everywhere (no raw `Image`, no base64), `@shopify/flash-list` is installed and used correctly on the two primary product surfaces (`ShopScreen`, `SearchResultScreen`), React Query is adopted with a sane cache policy, and `useNativeDriver: false` appears nowhere.

The damage is concentrated in **five high-leverage problems**, each confirmed by multiple independent audits:

1. **A 16 ms JS-thread `setInterval` (marquee) that is never cleared** — and runs 4–5× at once because all tabs mount eagerly. *(Critical, battery + FPS)*
2. **`lazy: false` on the tab navigator** — every tab, its fetches, Pusher, and timers mount at login. *(High, TTI)*
3. **The global context value is an unmemoized ~90-key object with ~30 inline callbacks** — so every consumer re-renders on any of 84 state changes, and every modal toggle re-renders the entire 2862-line `AppNavigator`. *(Critical, pervasive re-renders)*
4. **Unbounded `ScrollView` + `.map()` lists** (brand products, notifications, MLM tree) mount every row at once. *(Critical, scroll FPS + memory)*
5. **Zero `useMutation` / optimistic UI** — cart and wishlist actions do a full network refetch round-trip, so interactions feel laggy vs Shopee's instant feel. *(High, perceived speed)*

Fixing #1–#3 is mostly **S/M effort** and removes the worst regressions. #4–#5 plus the navigation/state architecture are the path to "Shopee-grade."

---

## 1. Critical performance regressions (fix first)

> **Status as of 2026-06-11:** 5 of 6 resolved. Also enabled the **React Compiler** (`experiments.reactCompiler` + `babel-plugin-react-compiler@1.0.0`), which auto-memoizes broadly.

| # | Finding | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Marquee `setInterval(tick,16)` never cleared | ✅ **Fixed** | `marqueeIntervalRef` + clear-before-start + unmount cleanup (`AppHeader.tsx`). Also `<MarqueeBanner>` is currently commented out, so it doesn't even run. (The JS-thread→Reanimated rewrite is moot until the banner is re-enabled.) |
| 1.2 | All tabs eager-mount (`lazy: false`) | ✅ **Fixed** | `lazy: true` (`TabNavigator.tsx`) — tabs mount on first focus, stay mounted after. **Device-test the first open of each tab.** |
| 1.3 | Context value unmemoized | ✅ **Fixed** | `appContextValue = useMemo(...)`, deps verified by `exhaustive-deps`; modal booleans are NOT in its deps, so toggling a modal no longer recreates the value or re-renders consumers. |
| 1.4 | God-component (modal booleans) | ⚠️ **Perf resolved; decomposition partial** | `navigationValue` memoized. The critical impact ("modal toggle recreates context / re-renders consumers") is **gone** via 1.3 + React Compiler. **Remaining = code decomposition only:** 19 modals still inline, but every one is coupled (context-exposed, in `hideTabBar`, or callback-bound), and **47 set-sites are the cart→checkout→payment→success state machine** (high-risk, entangled with #5). Continue extracting to `ModalHost` **incrementally, device-tested**; do **not** extract the payment flow blind. Info/wallet/history already migrated. |
| 1.5 | 2 s dark-mode poll in prod | ✅ **Fixed** | `if (!__DEV__) return` gates the poll (`AppNavigator.tsx`) — production never polls. |
| 1.6 | MFA poll no unmount cleanup | ✅ **Fixed** | `stopMfaPolling()` + unmount cleanup + clear-before-start (`LoginScreen.tsx`). |

**Remaining work:** only 1.4's **decomposition** (a maintainability refactor now that its perf is resolved), best done one device-tested modal-group at a time — leaving the cart/checkout/payment flow for a coordinated pass alongside #5 (payment-success verification).

---

## 2. Re-rendering & state management

| # | Finding | Evidence | Sev | Effort |
|---|---------|----------|-----|--------|
| 2.1 | Context value churn → whole tab subtree re-renders (see 1.3/1.4). Tab wrappers `HomeTabScreen`/`WishlistTabScreen`/`NotificationTabScreen`/`ProfileTabScreen` are plain fns consuming context and passing ~20–25 props (several unstable callbacks) into child screens — defeating `React.memo(ItemCard)`. | `TabNavigator.tsx:33/173/323/384` | 🟠 High | M |
| 2.2 | **CheckoutScreen totals/grouping unmemoized** — two `.reduce` + `groupItemsByBrand` run every render. | `CheckoutScreen.tsx:324-341` | 🟠 High | S |
| 2.3 | **FlashList nested in a horizontal ScrollView + inline `renderItem`** (categories double-wrapped). Breaks virtualization and defeats memo on `CategoryCircle`. | `HomeScreen.tsx:1026-1047` | 🟠 High | M |
| 2.4 | **Derived-state-in-state**: `isWishlisted` kept in `useState` + synced via `useEffect`; `optimisticCartCount` reset via effect. Should be derived during render with `useMemo`. | `ProductDetailScreen.tsx:219-226, 246-248` | 🟡 Medium | S |
| 2.5 | **`key={index}` on dynamic lists** (18 sites) — reconciliation churn / remounts. Priority: tab bar items, checkout/order rows. | `TabNavigator.tsx:475/505`; `CheckoutScreen.tsx:1361`; `OrderSuccessScreen.tsx:292` | 🟡 Medium | S |
| 2.6 | Pervasive inline `style={[…]}` arrays / `style={{…}}` objects in render — compounding allocations, worst inside list items. | `HomeScreen.tsx` throughout; `AppNavigator.tsx:1205` | 🟡 Medium | S |
| 2.7 | `console.log` + `.map()` allocations **inside** the `masonryColumns` `useMemo`. | `HomeScreen.tsx:497-542` | 🟢 Low | S |

**Already good (don't regress):** `CartScreen.tsx:714-729` memoizes totals/grouping correctly; `HomeScreen.tsx:493` memoizes `masonryColumns`; `ItemCard` is `React.memo`. Use these as the reference patterns.

---

## 3. List rendering & virtualization

`@shopify/flash-list@2.0.2` **is installed**, and `ShopScreen` / `SearchResultScreen` are the gold-standard masonry FlashList implementations — **reuse that exact pattern** for the fixes below.

| # | Finding | Evidence | Sev | Effort |
|---|---------|----------|-----|--------|
| 3.1 | **Brand products via `.map()` columns inside parent `ScrollView`** — unbounded catalog mounts every `ItemCard` at once; per-item `wishlistItems.find()`. Worst offender; violates CLAUDE.md. | `ShopByBrand/ShopByBrandHomeScreen.tsx:541-548` + `ShopByBrandScreen.tsx:526` | 🔴 Critical | L |
| 3.2 | **Notifications via `ScrollView` + `.map()`** — unbounded, expandable cards + nested `.map()`. | `NotificationsScreen.tsx:454-470` | 🔴 Critical | M |
| 3.3 | **MLM downline tree rendered recursively via `ScrollView` + `.map()`** — entire tree mounted, nested scroll. | `ReferralNetworkScreen.tsx:262,389` | 🟠 High | L |
| 3.4 | **Wishlist:** inline `renderItem`, **non-memoized `ItemList`**, unmemoized `getSortedWishlist()` each render. | `WishlistScreen.tsx:399-417`; `ItemList.tsx:66` | 🟠 High | M |
| 3.5 | **Cart:** ~400-line inline `renderItem`, no memoized row component — whole visible list re-renders on each qty tap. | `CartScreen.tsx:786,1429` | 🟠 High | M |
| 3.6 | **`keyExtractor` includes array index** — appending pages shifts indices, kills FlashList recycling / re-decodes images. | `ShopScreen.tsx:378-380` | 🟡 Medium | S |
| 3.7 | **O(n) `wishlistItems.find()` per card per render** — build a memoized `Map<productId, item>` for O(1) lookup. | `ShopScreen.tsx:332`; `ShopByBrandHomeScreen.tsx:155,185` | 🟡 Medium | S |
| 3.8 | Purchases / Wallet-network: inline `renderItem`, nested `FlatList scrollEnabled={false}` inside `ScrollView`, no memo/tuning. | `PurchasesScreen.tsx:771-774`; `AFWalletNetworkScreen.tsx:227,429` | 🟡 Medium | M |
| 3.9 | No `getItemLayout` / `removeClippedSubviews` anywhere — add to fixed-height FlatLists (cart, wishlist, orders, notifications). | global | 🟢 Low | S each |

**Fix first:** 3.1 and 3.2 (unbounded full-mount). 3.6 + 3.7 are quick high-value tweaks to the already-good ShopScreen.

---

## 4. Startup, timers, effects, memory, images

| # | Finding | Evidence | Sev | Effort |
|---|---------|----------|-----|--------|
| 4.1 | Marquee interval (see 1.1) — rewrite as a Reanimated `withRepeat`/`withTiming` `translateX` worklet on the UI thread. | `AppHeader.tsx:119-123` | 🔴 Critical | M |
| 4.2 | `lazy: false` tab fan-out (see 1.2) — switch to `lazy: true` + `useFocusEffect` fetch-on-focus (React Query cache smooths re-entry). | `TabNavigator.tsx:593` | 🟠 High | M |
| 4.3 | 2 s dark-mode `AsyncStorage` poll (1.5) + MFA poll leak (1.6). | `AppNavigator.tsx:826`; `LoginScreen.tsx:379` | 🟠 High | S |
| 4.4 | **649 `console.*` calls, no production stripping.** Heavy in `AppNavigator` (91), `ProductDetailScreen` (40), `SecurityScreen` (41), `CheckoutScreen` (36). Add `babel-plugin-transform-remove-console` (keep `error`/`warn`). | project-wide | 🟡 Medium | S |
| 4.5 | 1 s countdown intervals re-render full lists every tick (order timers, video keep-alive poll). | `PurchasesScreen.tsx:403`; `IndexScreen.tsx:107` | 🟡 Medium | S |
| 4.6 | Sync `JSON.parse` of `home_featured_products` on mount blocks the ready flag — trim payload / defer parse off critical path. | `AppNavigator.tsx:478-516` | 🟡 Medium | M |
| 4.7 | Pusher `channel.bind(...)` handlers never `unbind`-ed before unsubscribe. | `useNotifications.ts:118-184` | 🟢 Low | S |

**Already good:** `expo-image` everywhere (caching/transition), no plain RN `Image`, no `useNativeDriver: false`, BackHandler/Linking/AppState listeners are paired with removal, Hermes + R8 enabled, no heavy libs (no moment/lodash/redux).

---

## 5. Code-health regression risks (as the team/app grows)

- **`tsconfig.json` `"strict": false`** — the single biggest regression-prevention lever, off. No null-safety.
- **29 files with `@ts-nocheck`** — large untyped surface (CLAUDE.md forbids adding it to new files; burn down existing).
- **0 tests** — no Jest / RNTL; no coverage on cart, checkout, deep-link routing, or auth persistence.
- **2862-line `AppNavigator` + 127-key `AppContext`** — merge-conflict magnets and re-render cliffs.

---

## 6. Gap to "Shopee-grade"

| Dimension | Now | Target | Gap |
|---|---|---|---|
| Navigation | 52 boolean modals in 1 file, hand-rolled deep-link parser | `native-stack`, typed routes, native transitions, real back stack | **Large** |
| Cart/wishlist UX | invalidate + full refetch | optimistic `onMutate` + rollback (instant) | **Large** |
| Data fetching | 11 screens still on raw `axios` + `useEffect` | all via service + `useQuery` | **Medium** |
| Lists | `ScrollView` in 47 screens; FlashList in 3 | FlashList + infinite scroll everywhere | **Large** |
| Loading UX | spinners; skeletons in 1 screen | skeletons on all high-traffic screens | **Medium** |
| Search | `useLiveSearch` with no debounce in the hook | debounced instant autocomplete | **Small** |
| Offline / cold start | none except bespoke `apsara_cache:` (Home) | persisted query cache | **Medium** |
| Type safety / tests | strict off, 29 `@ts-nocheck`, 0 tests | strict on, 0 ts-nocheck, critical-flow tests | **Large** |
| Bundle/startup | Hermes + R8 on, no bloat | — | **None (good)** |

Screens still on direct `axios` (migrate to React Query — aligns with the existing `react-query-fetch-convention`): `CartScreen`, `CheckoutScreen`, `ProductDetailScreen`, `WishlistScreen`, `PurchasesScreen`, `SecurityScreen`, `ShopByBrandScreen`, `SearchScreen`, `IndexScreen`, `LoginScreen`, `OrderSuccessScreen`.

---

## 7. Phased roadmap

### Phase 1 — Stop the bleeding + quick felt wins (mostly S, ~1 week)
1. **Fix the marquee interval** (1.1/4.1): clear it in `useEffect` cleanup now; rewrite as Reanimated worklet next.
2. **Remove the 2 s dark-mode poll** (1.5) and **add MFA poll cleanup** (1.6).
3. **Memoize the context value + `useCallback` the ~30 callbacks** (1.3, S mitigation) and `navigationValue`.
4. **Add `babel-plugin-transform-remove-console`** (4.4) — keep `error`/`warn`.
5. **ShopScreen quick wins** (3.6 key-by-id, 3.7 wishlist `Map`).
6. **Optimistic cart count**: `useMutation` + `onMutate`→`setQueryData(["cartCount"])` + rollback.
7. **Debounce `useLiveSearch`** (~250 ms) inside the hook.

### Phase 2 — Data & list maturity (M, ~2–3 weeks)
8. Convert the **unbounded lists** to FlashList: brand products (3.1), notifications (3.2), then wishlist/cart row memoization (3.4, 3.5).
9. **Migrate the 11 axios-in-screen screens** to service + `useQuery` (priority: Cart, Checkout, ProductDetail, Wishlist, Purchases).
10. **`useMutation` + optimistic updates** for wishlist toggle (replace the hand-rolled `optimisticWishlistUpdates` in AppNavigator) and cart add/remove/qty.
11. **Standardize `useInfiniteQuery`** for all product/search lists; add `prefetchInfiniteQuery` near end-of-list + `expo-image` `prefetch()` for upcoming thumbnails.
12. **Roll out `SkeletonLoader`** to Products/Search/ProductDetail/Cart/Wishlist; add `RefreshControl` to remaining list screens.
13. **`lazy: true`** tabs + fetch-on-focus (4.2).
14. Add `@tanstack/react-query-persist-client` (AsyncStorage persister) → instant cold start + basic offline; retire `apsara_cache:` over time.

### Phase 3 — Architecture for scale (L, the keystone)
15. **Adopt `@react-navigation/native-stack`** (`react-native-screens` already installed). Replace the 52 boolean modals with stack screens → native transitions, real back stack, unmount-on-navigate (lower memory), and a typed `linking` config that **deletes the manual deep-link parser**. This also shrinks the 2862-line file.
16. **Decompose `AppContext` into Zustand stores per domain** (`cartStore`, `authStore`, `uiStore`/modals); persist `cartStore`. Selector subscriptions eliminate the "any change re-renders everything" cliff (CLAUDE.md endorses Zustand).
17. **Type-safety program**: flip `tsconfig` `strict: true`; burn down the 29 `@ts-nocheck` files one domain per PR.
18. **Test harness** (Jest + RNTL) covering cart, checkout, deep-link routing, auth persistence.

**Sequencing:** Phase 1 first (kills active regressions, ships fast UX wins), Phase 2 de-risks the data layer, then Phase 3's native-stack migration is the single change that fixes navigation memory, transitions, back-stack, and deep linking at once.

---

## 8. Key file references

- `src/navigation/AppNavigator.tsx` — 2862 lines; 35–52 modal booleans (1633–2450); context value `:1318-1455`; `navigationValue` `:1186`; manual deep-link parser `~539-769`; dark-mode poll `:826`; home cache hydrate `:478-516`.
- `src/navigation/TabNavigator.tsx` — `lazy: false` `:593`; tab wrappers `:33/173/323/384`.
- `src/components/AppHeader/AppHeader.tsx` — marquee interval `:119-123`.
- `src/context/AppContext.tsx` — 213 lines / ~127 keys; pass-through provider `:197-205`.
- `src/hooks/query/` — 18 query hooks; `useCartCount.ts` (invalidate-not-optimistic), `useLiveSearch.ts` (no debounce).
- Lists: `ShopByBrand/ShopByBrandHomeScreen.tsx`, `NotificationsScreen.tsx`, `ReferralNetworkScreen.tsx`, `WishlistScreen.tsx`, `CartScreen.tsx`; reference impl `ShopScreen.tsx` / `SearchResultScreen.tsx`.
- `tsconfig.json` (`strict: false`); 29 `@ts-nocheck` files; 0 test files.
