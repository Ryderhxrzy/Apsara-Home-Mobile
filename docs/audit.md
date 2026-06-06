Findings

High: all tabs mount immediately after login.
TabNavigator.tsx (line 432) sets lazy: false, so Home, Wishlist, Shop, Notification, Profile, their headers, timers, and fetches can start at once. This is a major startup/performance regression risk. Use lazy tabs/default behavior and fetch screen data only when focused.

High: AppHeader runs a 16ms JS interval with weak cleanup.
AppHeader.tsx (line 111) starts a marquee interval every ~frame. The cleanup returned by startScrolling is ignored by the effect and layout handler, so layout changes can leave extra intervals running. Move this to Animated.loop/Reanimated or store and clear the interval explicitly.

High: giant context value causes broad rerenders.
AppNavigator.tsx (line 1055) passes a huge inline object into AppContext.tsx (line 169). Any AppNavigator state change recreates the value and invalidates every useAppContext consumer. Split contexts or wrap the value in useMemo, with callbacks in useCallback.

High: Shop list virtualization is mostly bypassed.
ShopScreen.tsx (line 576) uses a FlatList, but its data is only header/content/footer; product cards are manually mapped inside one content row at ShopScreen.tsx (line 500). That means product virtualization is not really working. Also ShopScreen.tsx (line 390) does wishlistItems.find for every product render. Use a real product FlatList/FlashList masonry layout and a memoized wishlist map.

Medium: Home renders too much work inside a ScrollView.
HomeScreen.tsx (line 476) wraps the whole page in ScrollView, then nests list-like sections at HomeScreen.tsx (line 665), 686 (line 686), and 705 (line 705). This is okay for tiny data, but will regress with more categories/brands/products. Prefer SectionList/FlashList or cap horizontal data.

Medium: IndexScreen keeps the video alive by polling.
IndexScreen.tsx (line 91) runs setInterval every second just to replay the video. That creates constant JS wakeups on the first screen. Use focus/app-state/video events instead.

Medium: login success uses untracked timeouts.
IndexScreen.tsx (line 161) and 206 (line 206) delay navigation with setTimeout, but the timeout is not cleared on unmount. The loading state also resets before navigation, so duplicate login taps are possible.

Medium: too many production logs.
Active source has about 649 console.log/warn/error calls. Several are inside render paths, like HomeScreen.tsx (line 302) and AppNavigator.tsx (line 160). Strip logs in production and remove render-time logs first.

Low but important: type safety is disabled.
IndexScreen.tsx (line 1), AppNavigator.tsx (line 1), TabNavigator.tsx (line 1), and tsconfig.json (line 4) disable type checking. That makes rerender bugs and prop mistakes harder to catch.