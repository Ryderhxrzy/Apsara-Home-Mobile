// @ts-nocheck
import React, { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
} from "react-native"
import { Image } from "expo-image"
import Ionicons from "../ui/Icon"
import Toast from "react-native-toast-message"
import { Colors } from "../../constants/colors"
import {
  useDailyCheckin,
  useClaimDailyCheckin,
} from "../../hooks/query/useDailyCheckin"

interface DailyCheckinProps {
  isDarkMode?: boolean
  token?: string | null
  onCheckin?: (day: number) => void
  onViewMore?: () => void
}

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const translateY = new Animated.Value(0)
  const opacity = new Animated.Value(1)

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          delay: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
    // Run the confetti animation once per piece on mount; animated values and
    // delay are stable for the lifetime of this instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Random values are computed once per piece via lazy state initializers so
  // they stay stable across re-renders (and don't run impurely during render).
  const [randomEmoji] = useState(() => {
    const confettiEmojis = ["🎉", "🎊", "⭐", "✨", "🎈"]
    return confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]
  })
  const [randomLeft] = useState(() => Math.random() * 300 - 150)

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        {
          transform: [{ translateY }, { translateX: randomLeft }],
          opacity,
        },
      ]}
    >
      {randomEmoji}
    </Animated.Text>
  )
}

export default function DailyCheckin({
  isDarkMode = false,
  token,
  onCheckin,
}: DailyCheckinProps) {
  // The board is the single source of truth — ladder/streak/claimed all come
  // from the API (GET), never hardcoded.
  const { data: board } = useDailyCheckin(token)
  const claim = useClaimDailyCheckin(token)

  const [scaleAnims] = useState(() =>
    Array.from({ length: 7 }, () => new Animated.Value(1))
  )
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimedReward, setClaimedReward] = useState(0)

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    cardBg: isDarkMode ? "#1e293b" : "#f8fafc",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  const ladder = board?.ladder ?? []
  const calendar = board?.calendar
  // next_day_index is the claimable "current day" (1–7), or null once today is
  // already claimed. next_reward_pv is likewise null when checked in.
  const nextDayIndex = board?.next_day_index ?? null
  const nextRewardPv = board?.next_reward_pv ?? 0
  const canCheckIn = board?.can_check_in ?? false

  const calendarEntry = (day: number) => calendar?.find((c) => c.day === day)

  // Claimed state — authoritative from the server calendar's `claimed` flag
  // (e.g. Day 1 claimed yesterday → calendar day 1 claimed: true). Fallback when
  // no calendar: days before the next claimable day are already claimed.
  const isDayClaimed = (day: number) => {
    const entry = calendarEntry(day)
    if (entry) return !!entry.claimed
    return nextDayIndex != null ? day < nextDayIndex : false
  }

  // "Today" = the single claimable rung. The server marks it via
  // `is_today_reward` (true only when not yet checked in today). After today's
  // claim, next_day_index is null and no rung is "today" — today reads as
  // claimed instead. Fall back to next_day_index if the flag is absent.
  const isTodayReward = (day: number) => {
    const entry = calendarEntry(day)
    if (entry && typeof entry.is_today_reward === "boolean")
      return entry.is_today_reward
    return canCheckIn && day === nextDayIndex
  }

  // Claim TODAY (the only claimable day, per the API). 409 = already checked in.
  const handleClaim = () => {
    if (!canCheckIn || claim.isPending) return
    const anim = scaleAnims[(nextDayIndex ?? 1) - 1]
    if (anim) {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
    }

    claim.mutate(undefined, {
      onSuccess: (result) => {
        setClaimedReward(result.earned_pv)
        setShowClaimModal(true)
        onCheckin?.(result.day_index)
      },
      onError: (error: any) => {
        Toast.show({
          type: "info",
          text1:
            error?.status === 409
              ? "You've already checked in today."
              : error?.message || "Couldn't check in. Please try again.",
        })
      },
    })
  }

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.containerBg, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          PV Check In
        </Text>
      </View>

      {/* Days Container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContainer}
        style={styles.daysScroll}
      >
        {ladder.map((entry) => {
          const day = entry.day
          const reward = entry.pv
          const isChecked = isDayClaimed(day)
          const scaleAnim = scaleAnims[day - 1] ?? scaleAnims[0]
          const isToday = isTodayReward(day)
          const isClaimable = isToday && canCheckIn

          return (
            <Animated.View
              key={day}
              style={[
                styles.dayWrapper,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.dayCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: isChecked
                        ? Colors.sky + "15"
                        : "transparent",
                      borderColor: isToday ? Colors.sky : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={isClaimable ? handleClaim : undefined}
                  disabled={!isClaimable || claim.isPending}
                  activeOpacity={1}
                >
                  {/* Reward Badge with Check Icon */}
                  <View style={styles.rewardBadgeContainer}>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>+{reward}</Text>
                    </View>
                    {isChecked && (
                      <View style={styles.checkIconContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.sky}
                        />
                      </View>
                    )}
                  </View>

                  {/* Coin Image with Glow */}
                  <View
                    style={[
                      styles.coinGlowContainer,
                      {
                        backgroundColor: isChecked
                          ? Colors.sky + "35"
                          : day === 7
                            ? Colors.sky + "25"
                            : Colors.sky + "10",
                      },
                    ]}
                  >
                    <View style={styles.coinContainer}>
                      <Image
                        source={{
                          uri:
                            day <= 6
                              ? "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_1_kpacst.png"
                              : "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780879975/coin_2_h2taqv.png",
                        }}
                        style={styles.coinImage}
                        contentFit="contain"
                        transition={200}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Label - Outside/Below */}
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isToday ? Colors.sky : colors.text,
                    },
                  ]}
                >
                  {isToday ? "Today" : `Day ${day}`}
                </Text>
              </View>
            </Animated.View>
          )
        })}
      </ScrollView>

      {/* Check-in Button */}
      <TouchableOpacity
        style={[
          styles.checkinButton,
          {
            borderTopColor: colors.borderLight,
            opacity: canCheckIn && !claim.isPending ? 1 : 0.55,
          },
        ]}
        onPress={handleClaim}
        disabled={!canCheckIn || claim.isPending}
      >
        <Ionicons name="flash" size={16} color={Colors.sky} />
        <Text style={styles.checkinButtonText}>
          {claim.isPending
            ? "Claiming..."
            : canCheckIn
              ? `Claim +${nextRewardPv} PV Points`
              : "Checked in today ✓"}
        </Text>
      </TouchableOpacity>

      {/* Claim Modal */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Confetti */}
          {showClaimModal &&
            Array.from({ length: 12 }).map((_, i) => (
              <ConfettiPiece key={i} delay={i * 100} />
            ))}

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.containerBg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Congratulations!
            </Text>

            <View style={styles.modalRewardContainer}>
              <Text style={styles.modalRewardText}>+{claimedReward}</Text>
              <Text
                style={[styles.modalRewardLabel, { color: colors.textSec }]}
              >
                PV Points Earned
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.sky }]}
              onPress={() => setShowClaimModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Awesome! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  daysScroll: {
    maxHeight: 165,
  },
  daysScrollContainer: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    gap: 0,
  },
  dayWrapper: {
    alignItems: "center",
    width: 70,
  },
  dayCardWrapper: {
    width: "100%",
    alignItems: "center",
    gap: 6,
  },
  dayCard: {
    width: 60,
    height: 95,
    borderRadius: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  coinGlowContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 50,
    padding: 6,
  },
  coinContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderRadius: 18,
  },
  coinImage: {
    width: 36,
    height: 36,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  rewardBadgeContainer: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    zIndex: 10,
  },
  rewardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  rewardBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.sky,
  },
  checkinButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  checkinButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.sky,
  },
  checkIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "85%",
    maxWidth: 320,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  modalRewardContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  modalRewardText: {
    fontSize: 56,
    fontWeight: "800",
    color: Colors.sky,
  },
  modalRewardLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    width: "100%",
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
  },
})
