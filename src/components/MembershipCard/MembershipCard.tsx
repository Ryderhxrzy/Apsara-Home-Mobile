import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Image } from "expo-image"
import Icon from "../ui/Icon"
import { Colors } from "../../constants/colors"
import { radius, shadow, getColors } from "../../theme/theme"
import { getBadgeImageSource } from "../../constants/tierConfig"

interface MembershipCardProps {
  badgeName?: string
  badgeImage?: string | any
  remainingPv?: number
  orders?: number
  cart?: number
  referrals?: number
  isDarkMode?: boolean
  onCartPress?: () => void
  onReferralPress?: () => void
  onOrdersPress?: () => void
}

/**
 * "Your membership" white card: badge + level/subtitle on top (full width, no
 * truncation), then an evenly-spaced Orders/Cart/Referrals/PV-Left strip. In the
 * app's sky theme.
 */
function MembershipCard({
  badgeName,
  badgeImage,
  remainingPv = 0,
  orders = 0,
  cart = 0,
  referrals = 0,
  isDarkMode = false,
  onCartPress,
  onReferralPress,
  onOrdersPress,
}: MembershipCardProps) {
  const t = getColors(isDarkMode)
  const hasBadge = !!badgeName
  const badgeSource = hasBadge ? getBadgeImageSource(badgeImage) : null

  const renderStat = (
    icon: string,
    value: number,
    label: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.statCol}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon name={icon} size={19} color={Colors.sky} />
      <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeWrap}>
            {badgeSource ? (
              <Image
                source={badgeSource}
                style={styles.badgeImg}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.badgeFallback,
                  { backgroundColor: t.primarySoft },
                ]}
              >
                <Icon name="ribbon-outline" size={30} color={Colors.sky} />
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={[styles.level, { color: t.text }]} numberOfLines={1}>
              {hasBadge ? badgeName : "No Badge Yet"}
            </Text>
            {/* <Text
              style={[styles.subtext, { color: t.textSecondary }]}
              numberOfLines={2}
            >
              {hasBadge
                ? "Grow your team and earn more per order."
                : "Invite 2 friends to unlock your first badge."}
            </Text> */}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: t.border }]} />

        <View style={styles.statRow}>
          {renderStat("bag-outline", orders, "Orders", onOrdersPress)}
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          {renderStat("cart-outline", cart, "Cart", onCartPress)}
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          {renderStat(
            "people-outline",
            referrals,
            "Referrals",
            onReferralPress
          )}
          <View style={[styles.statDivider, { backgroundColor: t.border }]} />
          {renderStat("star-outline", remainingPv, "PV Left")}
        </View>
      </View>
    </View>
  )
}

export default React.memo(MembershipCard)

const styles = StyleSheet.create({
  wrap: {
    // paddingHorizontal: ,
    paddingTop: 10,
  },
  card: {
    borderRadius: radius["md"],
    borderWidth: 1,
    padding: 12,
    gap: 10,
    ...shadow.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  badgeWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  badgeFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  level: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtext: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  divider: {
    height: 1,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 34,
    alignSelf: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
})
