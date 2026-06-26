import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon from "../ui/Icon"
import { Colors } from "../../constants/colors"
import { getColors, tw } from "../../theme/theme"

// AF Home brand wordmark — bundled locally so it renders instantly (no network
// flash) and works offline. The full "AF HOME" lockup (149×50, ~3:1).
const BRAND_LOGO = require("../../../assets/af_home_logo.png")

interface HomeHeaderProps {
  user?: { name?: string } | null
  cartCount?: number
  unreadCount?: number
  isDarkMode?: boolean
  onSearchPress?: () => void
  onCartPress?: () => void
  onNotificationPress?: () => void
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * Clean Home top bar (greeting + bell + cart, then a search field) — the
 * minimal light header from the new design. Distinct from the filter-heavy
 * AppHeader used by Shop. Tapping the search field opens the search screen.
 */
function HomeHeader({
  user,
  cartCount = 0,
  unreadCount = 0,
  isDarkMode = false,
  onSearchPress,
  onCartPress,
  onNotificationPress,
  containerStyle,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets()
  const t = getColors(isDarkMode)
  const firstName = user?.name?.split(" ")[0] ?? "there"

  const colors = {
    bg: t.card,
    text: t.text,
    textSec: t.textSecondary,
    border: t.border,
    searchBg: isDarkMode ? tw.slate[900] : tw.slate[100],
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 8,
          borderBottomColor: colors.border,
        },
        containerStyle,
      ]}
    >
      {/* Brand row: logo on the left, actions on the right */}
      <View style={styles.topRow}>
        <Image
          source={BRAND_LOGO}
          style={styles.logo}
          contentFit="contain"
          transition={150}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onNotificationPress}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Icon
              name="notifications-outline"
              size={23}
              color={colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onCartPress}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Icon name="cart-outline" size={23} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingWrap}>
        <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={1}>
          Hi, {firstName} 👋
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSec }]}
          numberOfLines={1}
        >
          Find the best products for your lifestyle
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.searchField, { backgroundColor: colors.searchBg }]}
        activeOpacity={0.7}
        onPress={onSearchPress}
      >
        <Icon name="search" size={18} color={colors.textSec} />
        <Text
          style={[styles.searchPlaceholder, { color: colors.textSec }]}
          numberOfLines={1}
        >
          Search products, brands...
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default React.memo(HomeHeader)

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logo: {
    // Full "AF HOME" wordmark (149×50, ~3:1) — size the box to that ratio so it
    // reads as a wordmark instead of letterboxing inside a square.
    height: 34,
    width: 101,
  },
  greetingWrap: {
    marginTop: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
})
