import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  BackHandler,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { API_CONFIG } from '../config/api';

interface LeaderboardEntry {
  id: number;
  name: string;
  username: string;
  avatar: string;
  referrals: number;
}

const MEDAL_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#94A3B8',
  3: '#C08457',
};

const getMedalIcon = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

const getTierLabel = (rank: number) => {
  if (rank === 1) return 'Gold';
  if (rank === 2) return 'Silver';
  if (rank === 3) return 'Bronze';
  if (rank <= 10) return 'Elite';
  if (rank <= 20) return 'Rising';
  return 'Member';
};

export default function LeaderboardScreen({
  isDarkMode = false,
  onClose,
}: {
  isDarkMode?: boolean;
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const glow = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const colors = {
    bg: isDarkMode ? '#0a0e27' : '#0ea5e9',
    headerStart: '#0066FF',
    headerEnd: '#00D4FF',
    cardAlt: isDarkMode ? '#0c1728' : '#f8fbff',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#23324a' : '#dbe7f3',
    accent: Colors.sky,
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, [bob, glow]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/public/top-members?sort=referrals&per_page=20`);
      const result = await response.json();
      const formattedData = Array.isArray(result?.data)
        ? result.data.map((member: any) => ({
            id: member.id,
            name: member.name,
            username: member.username,
            avatar: member.avatar,
            referrals: Number(member.referrals) || 0,
          }))
        : [];
      setLeaderboardData(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
  };

  const derivedLeaderboard = useMemo(() => [...leaderboardData], [leaderboardData]);
  const topThree = derivedLeaderboard.slice(0, 3);
  const restRankings = derivedLeaderboard.slice(3);

  const renderTopCard = (entry: LeaderboardEntry, position: 'first' | 'second' | 'third', rank: number) => {
    const positionConfig = {
      first: { cardBg: ['#FF6B9D', '#FFA500', '#FFD700'], cardHeight: 240, cardWidth: 112, avatarSize: 72 },
      second: { cardBg: ['#4FC3F7', '#29B6F6', '#0288D1'], cardHeight: 174, cardWidth: 96, avatarSize: 64 },
      third: { cardBg: ['#FF7043', '#FF5722', '#D84315'], cardHeight: 174, cardWidth: 96, avatarSize: 64 },
    };
    const config = positionConfig[position];
    const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
    const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    const avatarTheme = position === 'first'
      ? { border: '#D4AF37', inner: '#FFF7D6', text: '#8A6500', ring: ['#FFF9E6', '#D4AF37'] as [string, string] }
      : position === 'second'
        ? { border: '#94A3B8', inner: 'rgba(255,255,255,0.18)', text: '#ffffff', ring: ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.12)'] as [string, string] }
        : { border: '#C08457', inner: 'rgba(255,255,255,0.18)', text: '#ffffff', ring: ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.12)'] as [string, string] };
    const initials = entry.name
      .split(' ')
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');

    return (
      <Animated.View
        key={entry.id}
        style={[styles.topCardWrapper, { transform: [{ translateY }, { scale: position === 'first' ? Animated.multiply(scale, pulse) : scale }] }]}
      >
        <View style={styles.avatarContainer}>
          {position === 'first' && (
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
          )}
          <View
            style={[
              styles.topCardAvatarOuter,
              {
                width: config.avatarSize,
                height: config.avatarSize,
                borderRadius: config.avatarSize / 2,
                borderColor: avatarTheme.border,
              },
            ]}
            >
          {entry.avatar ? (
            <View style={styles.topCardAvatarImageWrap}>
              <Image source={{ uri: entry.avatar }} style={styles.topCardAvatarImage} />
            </View>
          ) : (
            <View style={styles.topCardInitialCircle}>
              <LinearGradient
                colors={avatarTheme.ring}
                style={styles.topCardInitialRing}
              >
                <View style={[styles.topCardInitialInner, { backgroundColor: avatarTheme.inner, borderColor: avatarTheme.border }]}>
                  <Text style={[styles.topCardInitial, { color: avatarTheme.text, fontSize: position === 'first' ? 26 : 22 }]}>
                    {initials}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}
            </View>
        </View>

        <Text style={[styles.topCardName, { color: Colors.white }]} numberOfLines={2}>
          {entry.name}
        </Text>

        <View style={styles.topCardContainer}>
          <View style={styles.topCardBadge}>
            <Ionicons name="people" size={13} color="#ffffff" />
            <Text style={styles.topCardBadgeText}>{entry.referrals} refs</Text>
          </View>

          <LinearGradient
            colors={config.cardBg as [string, string]}
            style={[
              styles.topCard,
              {
                width: config.cardWidth,
                height: config.cardHeight,
                borderRadius: 18,
                paddingTop: position === 'first' ? 34 : 30,
                borderWidth: 2,
                borderColor: position === 'first' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)',
                shadowColor: position === 'first' ? '#FFD700' : position === 'second' ? '#C0C0C0' : '#CD7F32',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
          >
            <View style={styles.topCardDecor} />
            <Text style={styles.topCardTier}>{getTierLabel(rank)}</Text>
            <Text style={styles.topCardRankNumber}>{rank}</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const renderLeaderboardRow = (entry: LeaderboardEntry, rank: number) => {
    const initials = entry.name
      .split(' ')
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');

    return (
      <View key={entry.id} style={[styles.rankingItem, { borderBottomColor: colors.border }]}>
        <View style={styles.rankingItemLeft}>
          <View style={[styles.rankingBadge, { borderColor: MEDAL_COLORS[rank] || colors.border }]}>
            <View style={styles.rankingBadgeInner}>
              <Text style={[styles.rankingBadgeText, { color: rank <= 3 ? Colors.white : '#0369A1' }]}>
                {getMedalIcon(rank) || `${rank}`}
              </Text>
            </View>
          </View>
          {entry.avatar ? (
            <View style={[styles.rankingAvatar, styles.rankingAvatarFallback, { borderColor: MEDAL_COLORS[rank] || colors.border, backgroundColor: colors.cardAlt }]}>
              <View style={[styles.rankingAvatarImageWrap, { borderColor: 'rgba(255,255,255,0.18)' }]}>
                <Image source={{ uri: entry.avatar }} style={styles.rankingAvatarImage} />
              </View>
            </View>
          ) : (
            <View style={[styles.rankingAvatar, styles.rankingAvatarFallback, { backgroundColor: colors.cardAlt, borderColor: MEDAL_COLORS[rank] || colors.border }]}>
              <LinearGradient
                colors={rank <= 3 ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)'] : ['#E0F2FE', '#BAE6FD']}
                style={styles.rankingAvatarFallbackInner}
              >
                <Text style={[styles.rankingAvatarEmoji, { color: rank <= 3 ? Colors.white : '#0369A1' }]}>
                  {initials}
                </Text>
              </LinearGradient>
            </View>
          )}
          <View style={styles.rankingInfo}>
            <Text style={[styles.rankingName, { color: colors.text }]} numberOfLines={1}>
              {entry.username}
            </Text>
            <Text style={[styles.rankingEarnings, { color: colors.textSec }]}>{entry.referrals} referrals</Text>
          </View>
        </View>
        <View style={styles.rankingMeta}>
          <Text style={[styles.rankingTrend, { color: colors.textSec }]}>Member</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.headerStart }]} edges={[]}>
        <LinearGradient colors={['#0066FF', '#00D4FF', '#0066FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBackground}>
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          <View style={styles.headerDecor3} />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <View style={styles.menuBtn} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.headerStart }]} edges={[]}>
      <LinearGradient colors={['#0066FF', '#00D4FF', '#0066FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBackground}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerDecor3} />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <View style={styles.menuBtn} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        {topThree.length > 0 && (
          <LinearGradient
            colors={['#0066FF', '#00D4FF', '#0066FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.topThreeContainer, styles.topThreeOverlap]}
          >
            <View style={styles.topThreeGrid}>
              {topThree[1] && renderTopCard(topThree[1], 'second', 2)}
              {topThree[0] && renderTopCard(topThree[0], 'first', 1)}
              {topThree[2] && renderTopCard(topThree[2], 'third', 3)}
            </View>
          </LinearGradient>
        )}

        {restRankings.length > 0 && (
          <View style={[styles.rankingsSection, { backgroundColor: isDarkMode ? '#0f1b31' : '#f4f8fc', borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSec }]}>Rankings updated in a simple, readable list.</Text>
              </View>
            </View>
            {restRankings.map((entry, idx) => renderLeaderboardRow(entry, idx + 4))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
  },
  headerDecor1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -40,
    right: -30,
  },
  headerDecor2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 10,
    left: -20,
  },
  headerDecor3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: 40,
    left: '50%',
    marginLeft: -30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 0,
    height: 72,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topThreeContainer: {
    borderRadius: 0,
    marginTop: -34,
    paddingHorizontal: 12,
    paddingTop: 54,
    paddingBottom: 20,
  },
  topThreeOverlap: {
    marginHorizontal: 0,
    paddingBottom: 28,
  },
  topThreeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
    width: '100%',
  },
  topCardWrapper: {
    alignItems: 'center',
    maxWidth: 112,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    position: 'absolute',
    top: -12,
    zIndex: 20,
  },
  crownEmoji: {
    fontSize: 28,
  },
  topCardContainer: {
    alignItems: 'center',
    position: 'relative',
    marginTop: 12,
  },
  topCard: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingBottom: 12,
    position: 'relative',
  },
  topCardDecor: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    opacity: 0.15,
    pointerEvents: 'none',
  },
  topCardBadge: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 58,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topCardBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  topCardAvatarOuter: {
    overflow: 'hidden',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardAvatarImageWrap: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topCardAvatarImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  topCardInitialCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  topCardInitialRing: {
    width: '88%',
    height: '88%',
    borderRadius: 999,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardInitialInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topCardInitial: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  topCardName: {
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  topCardTier: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  topCardRankNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 64,
    marginTop: 12,
  },
  rankingsSection: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: -20,
    marginHorizontal: 0,
    paddingBottom: 2,
    backgroundColor: '#f8f9fa',
    borderTopColor: 'rgba(0, 102, 255, 0.2)',
    borderLeftColor: 'rgba(0, 102, 255, 0.2)',
    borderRightColor: 'rgba(0, 102, 255, 0.2)',
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    backgroundColor: '#F0F7FF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: 'rgba(0, 102, 255, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankingBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  rankingBadgeInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  rankingBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  rankingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  rankingAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingAvatarImageWrap: {
    width: '84%',
    height: '84%',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rankingAvatarImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  rankingAvatarFallbackInner: {
    width: '86%',
    height: '86%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rankingAvatarEmoji: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  rankingInfo: { gap: 2, flex: 1 },
  rankingName: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  rankingEarnings: {
    fontSize: 11,
    fontWeight: '600',
  },
  rankingMeta: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  rankingTrend: {
    fontSize: 11,
    fontWeight: '800',
  },
});

