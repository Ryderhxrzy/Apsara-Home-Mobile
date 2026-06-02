import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface DailyCheckinProps {
  isDarkMode?: boolean;
  onCheckin?: (day: number) => void;
  onViewMore?: () => void;
}

const CHECKIN_REWARDS = [20, 25, 30, 35, 40, 45, 50]; // PV for each day
const DAY_LABELS = ['Today', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const translateY = new Animated.Value(0);
  const opacity = new Animated.Value(1);

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
    ]).start();
  }, []);

  const confettiEmojis = ['🎉', '🎊', '⭐', '✨', '🎈'];
  const randomEmoji = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
  const randomLeft = Math.random() * 300 - 150;

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        {
          transform: [
            { translateY },
            { translateX: randomLeft },
          ],
          opacity,
        },
      ]}
    >
      {randomEmoji}
    </Animated.Text>
  );
};

export default function DailyCheckin({ isDarkMode = false, onCheckin }: DailyCheckinProps) {
  const [checkedInDays, setCheckedInDays] = useState<number[]>([]);
  const [scaleAnims] = useState(DAY_LABELS.map(() => new Animated.Value(1)));
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    try {
      // Component initialization
    } catch (error) {
      setHasError(true);
      console.log('DailyCheckin error:', error);
    }
  }, []);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  const handleCheckin = (day: number) => {
    if (!checkedInDays.includes(day)) {
      Animated.sequence([
        Animated.timing(scaleAnims[day - 1], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[day - 1], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setCheckedInDays([...checkedInDays, day]);
      setClaimedReward(CHECKIN_REWARDS[day - 1]);
      setShowClaimModal(true);

      if (onCheckin) {
        onCheckin(day);
      }
    }
  };


  const todayReward = CHECKIN_REWARDS[0];
  const totalPV = CHECKIN_REWARDS.reduce((sum, pv) => sum + pv, 0);

  if (hasError) {
    return (
      <View style={styles.section}>
        <Text>Daily Check-In</Text>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PV Check In</Text>
      </View>

      {/* Days Container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContainer}
        style={styles.daysScroll}
      >
        {CHECKIN_REWARDS.map((reward, index) => {
          const day = index + 1;
          const isChecked = checkedInDays.includes(day);
          const scaleAnim = scaleAnims[index];
          const isToday = day === 1;

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
                      backgroundColor: isChecked ? Colors.sky + '15' : 'transparent',
                      borderColor: isToday ? Colors.sky : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleCheckin(day)}
                  disabled={isChecked}
                  activeOpacity={1}
                >
                  {/* Reward Badge with Check Icon */}
                  <View style={styles.rewardBadgeContainer}>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>+{reward}</Text>
                    </View>
                    {isChecked && (
                      <View style={styles.checkIconContainer}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.sky} />
                      </View>
                    )}
                  </View>

                  {/* Coin Image with Glow */}
                  <View style={[
                    styles.coinGlowContainer,
                    {
                      backgroundColor: isChecked
                        ? Colors.sky + '35'
                        : day === 7 ? Colors.sky + '25' : Colors.sky + '10',
                    }
                  ]}>
                    <View style={styles.coinContainer}>
                      <Image
                        source={day <= 6 ? require('../../../assets/coin_1.png') : require('../../../assets/coin_2.png')}
                        style={styles.coinImage}
                        resizeMode="contain"
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
                  {DAY_LABELS[index]}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Check-in Button */}
      <TouchableOpacity
        style={[styles.checkinButton, { borderTopColor: colors.borderLight }]}
        onPress={() => handleCheckin(1)}
        disabled={checkedInDays.includes(1)}
      >
        <Ionicons name="flash" size={16} color={Colors.sky} />
        <Text style={styles.checkinButtonText}>Claim +{todayReward} PV Points</Text>
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
          {showClaimModal && Array.from({ length: 12 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 100} />
          ))}

          <View style={[styles.modalContent, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Congratulations!</Text>

            <View style={styles.modalRewardContainer}>
              <Text style={styles.modalRewardText}>+{claimedReward}</Text>
              <Text style={[styles.modalRewardLabel, { color: colors.textSec }]}>PV Points Earned</Text>
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
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
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
    alignItems: 'center',
    width: 70,
  },
  dayCardWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  dayCard: {
    width: 60,
    height: 95,
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coinGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 50,
    padding: 6,
  },
  coinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardBadgeContainer: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    zIndex: 10,
  },
  rewardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  rewardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.sky,
  },
  checkinButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checkinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.sky,
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
    borderWidth: 1,
    shadowColor: '#000',
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
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalRewardContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  modalRewardText: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.sky,
  },
  modalRewardLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 28,
    left: '50%',
  },
});
