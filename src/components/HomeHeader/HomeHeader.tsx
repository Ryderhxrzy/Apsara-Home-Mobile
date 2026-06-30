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

// AF Home brand wordmark — bundled locally so it renders instantly (no network
// flash) and works offline. The full "AF HOME" lockup (149×50, ~3:1).
const BRAND_LOGO = require("../../../assets/adaptive-icon3.png")

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

  // The header sits on top of the home "hero" gradient (rendered by the parent),
  // so its own background is transparent. Text/icons go light to read on it.
  const colors = {
    bg: "transparent",
    text: "#ffffff",
    textSec: "rgba(255,255,255,0.82)",
    border: "transparent",
    // Solid white search pill that pops on the sky gradient; its icon + text use
    // a muted slate so they read on the white (the header icons stay white).
    searchBg: "#ffffff",
    searchText: "#64748b",
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
      {/* Single row: search field · notification + cart. */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.searchField, { backgroundColor: colors.searchBg }]}
          activeOpacity={0.7}
          onPress={onSearchPress}
        >
          <Icon name="search" size={18} color={colors.searchText} />
          <Text
            style={[styles.searchPlaceholder, { color: colors.searchText }]}
            numberOfLines={1}
          >
            Search...
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onNotificationPress}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Icon name="notifications-outline" size={23} color={colors.text} />
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
    </View>
  )
}

export default React.memo(HomeHeader)

const styles = StyleSheet.create({
  container: {
    // Align the header content with the body content's inset (12).
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    // Compact square brand icon on the right of the header.
    height: 36,
    width: 36,
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    // Match the ItemCard corner radius (8) so the search pill feels consistent.
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
})
