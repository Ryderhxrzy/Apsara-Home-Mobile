import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform, Linking, Share, Clipboard, Modal, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import PrimaryButton from '../components/Button/PrimaryButton';
import OutlineButton from '../components/Button/OutlineButton';
import { referralService, ReferralTree } from '../services/referralService';
import { accountService } from '../services/accountService';
import LevelProgress from '../components/LevelProgress/LevelProgress';
import ReferralNetworkScreen from './ReferralNetworkScreen';
import ProfileDetailsScreen from './ProfileDetailsScreen';
import { ChatBotIcon } from '../components/ChatBot';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string;
  badge_name?: string;
  badge_image?: string;
  monthly_activation?: {
    remaining_pv: number;
  };
}

interface ProfileScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
  onCartPress?: () => void;
  cartCount?: number;
  token?: string | null;
  onShowProfileDetails?: (show: boolean) => void;
  onShowReferralNetwork?: (show: boolean) => void;
}

const REFERRAL_STATS = [
  { label: 'Total', value: '5', icon: 'people-outline' as const },
  { label: 'Pending', value: '₱1,200', icon: 'time-outline' as const },
  { label: 'Earned', value: '₱4,500', icon: 'cash-outline' as const },
];

const PURCHASE_ITEMS = [
  { icon: 'wallet-outline' as const, label: 'Paid' },
  { icon: 'hourglass-outline' as const, label: 'Processing' },
  { icon: 'cube-outline' as const, label: 'To Ship' },
  { icon: 'car-outline' as const, label: 'To Receive' },
  { icon: 'star-outline' as const, label: 'To Rate' },
];

const SOCIAL_ITEMS = [
  { icon: 'logo-facebook' as const, label: 'Facebook', url: 'https://facebook.com/afhome.ph', color: '#1877F2' },
  { icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://instagram.com/afhome.ph', color: '#E4405F' },
  { icon: 'logo-tiktok' as const, label: 'TikTok', url: 'https://tiktok.com/@afhome.ph', color: '#000000' },
  { icon: 'globe-outline' as const, label: 'Website', url: 'https://www.afhome.ph', color: Colors.sky },
];

const MENU_ITEMS = [
  { icon: 'settings-outline' as const, label: 'Settings', chevron: true, key: 'settings' },
  { icon: 'log-out-outline' as const, label: 'Log Out', chevron: false, danger: true, key: 'logout' },
];

export default function ProfileScreen({ user, onLogout, onNavigateSettings, onCartPress, cartCount = 0, token, onShowProfileDetails, onShowReferralNetwork }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [enlargedQR, setEnlargedQR] = useState<'signup' | 'shopping' | null>(null);
  const [referralTree, setReferralTree] = useState<ReferralTree | null>(null);
  const [showReferralNetwork, setShowReferralNetwork] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const photoUrl = user?.avatar_url ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] ?? 'User';
  const username = user?.username || 'guest';
  const signupUrl = `https://afhome.ph/ref/${username}`;
  const shoppingUrl = `https://afhome.ph/shop?ref=${username}`;

  const handleCopy = (url: string) => {
    Clipboard.setString(url);
    Toast.show({
      type: 'success',
      text1: 'Link Copied',
      text2: 'Referral link copied to clipboard',
    });
  };

  const handlePurchaseItemClick = (label: string) => {
    Toast.show({
      type: 'info',
      text1: label,
      text2: 'Purchase history for ' + label,
    });
  };

  useEffect(() => {
    onShowProfileDetails?.(showProfileDetails);
  }, [showProfileDetails, onShowProfileDetails]);

  useEffect(() => {
    onShowReferralNetwork?.(showReferralNetwork);
  }, [showReferralNetwork, onShowReferralNetwork]);

  useEffect(() => {
    if (token) {
      fetchReferralTree();
      fetchLoyaltyData();
    }
  }, [token]);

  const fetchReferralTree = async () => {
    if (!token) return;
    try {
      const data = await referralService.getReferralTree(token);
      setReferralTree(data);
    } catch (error: any) {
      console.error('Error fetching referral tree:', error);
    }
  };

  const fetchLoyaltyData = async () => {
    if (!token) return;
    setLoadingLoyalty(true);
    try {
      const snapshot = await accountService.getAccountSnapshot(token);
      setLoyaltyData(snapshot.loyalty);
    } catch (error: any) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const handleViewNetwork = async () => {
    if (!referralTree) {
      setLoadingReferral(true);
      try {
        const data = await referralService.getReferralTree(token!);
        setReferralTree(data);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to load referral network',
        });
      } finally {
        setLoadingReferral(false);
      }
    }
    setShowReferralNetwork(true);
  };

  const handleShare = async (url: string, type?: 'signup' | 'shopping') => {
    try {
      let message = `Check out AF Home! ${url}`;
      if (type === 'signup') {
        message = `Join me as an AF Home member and start earning rewards! Register here: ${url}`;
      } else if (type === 'shopping') {
        message = `Shop with me on AF Home and enjoy amazing products! Use my link: ${url}`;
      }
      await Share.share({
        message: message,
        url: url,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.headerLeft} onPress={() => setShowProfileDetails(true)} activeOpacity={0.7}>
          <View style={styles.headerAvatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={styles.headerAvatarInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.headerNameContainer}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>{user?.name ?? 'Guest'}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={styles.profileIcon} />
            </View>
            {user?.username && (
              <View style={styles.usernameRow}>
                <Text style={styles.usernameText}>@{user.username}</Text>
                {user?.badge_name && (
                  <>
                    <View style={styles.usernameDot} />
                    <View style={styles.userBadge}>
                      {user.badge_image ? (
                        <Image source={{ uri: user.badge_image }} style={styles.badgeImageSmall} />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark" size={10} color={Colors.white} />
                          <Text style={styles.userBadgeText}>{user.badge_name}</Text>
                        </>
                      )}
                    </View>
                  </>
                )}
                <View style={styles.usernameDot} />
                <Text style={styles.usernamePvText}>{user.monthly_activation?.remaining_pv ?? 0} PV</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onCartPress}>
            <Ionicons name="cart-outline" size={20} color={Colors.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onNavigateSettings}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Progress */}
        {loyaltyData && (
          <LevelProgress
            currentTier={loyaltyData.tier}
            currentRank={loyaltyData.rank}
            personalPv={loyaltyData.personal_pv}
            referralCount={loyaltyData.referral_count}
            activeMembers={loyaltyData.active_members_count}
            activeBuilders={loyaltyData.active_builders_count}
            activeLeaders={loyaltyData.active_leaders_count}
            username={user?.username}
            loading={loadingLoyalty}
            onViewDetails={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Level details screen will be available soon',
              });
            }}
          />
        )}

        {/* My Purchases */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>My Purchases</Text>
            <TouchableOpacity style={styles.purchasesViewAll}>
              <Text style={styles.purchasesViewAllText}>View Purchase History</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.purchasesGrid}
            scrollEnabled={true}
          >
            {PURCHASE_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.purchaseItem}
                activeOpacity={0.7}
                onPress={() => handlePurchaseItemClick(item.label)}
              >
                <View style={styles.purchaseIconContainer}>
                  <Ionicons name={item.icon} size={24} color={Colors.sky} />
                </View>
                <Text style={styles.purchaseLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* My Referrals */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>My Referrals</Text>
            <TouchableOpacity
              style={styles.purchasesViewAll}
              onPress={handleViewNetwork}
              disabled={loadingReferral}
            >
              {loadingReferral ? (
                <ActivityIndicator size="small" color={Colors.textSecondary} />
              ) : (
                <>
                  <Text style={styles.purchasesViewAllText}>View Network</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.referralsGrid}>
            {referralTree ? (
              <>
                <TouchableOpacity
                  style={styles.referralItem}
                  activeOpacity={0.7}
                  onPress={handleViewNetwork}
                >
                  <View style={[styles.referralIconContainer, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="people-outline" size={28} color={Colors.sky} />
                  </View>
                  <Text style={styles.referralItemValue}>{referralTree.summary.total_network}</Text>
                  <Text style={styles.referralItemLabel}>Total</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.referralItem}
                  activeOpacity={0.7}
                  onPress={handleViewNetwork}
                >
                  <View style={[styles.referralIconContainer, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="person-outline" size={28} color="#f59e0b" />
                  </View>
                  <Text style={styles.referralItemValue}>{referralTree.summary.direct_count}</Text>
                  <Text style={styles.referralItemLabel}>Direct</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.referralItem}
                  activeOpacity={0.7}
                  onPress={handleViewNetwork}
                >
                  <View style={[styles.referralIconContainer, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="cash-outline" size={28} color="#16a34a" />
                  </View>
                  <Text style={styles.referralItemValue}>₱{referralTree.root.total_earnings}</Text>
                  <Text style={styles.referralItemLabel}>Earned</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator size="large" color={Colors.sky} />
            )}
          </View>
        </View>

        {/* Affiliate Referral QR */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <View>
              <Text style={styles.purchasesTitle}>Affiliate Referral QR</Text>
              <Text style={styles.qrSubtitle}>Ready to Share</Text>
            </View>
          </View>

          <View style={styles.qrContainer}>
            {/* Signup QR Section */}
            <View style={styles.qrCard}>
              <View style={styles.qrCardHeader}>
                <View style={styles.qrIconBox}>
                  <Ionicons name="person-add" size={16} color={Colors.sky} />
                </View>
                <Text style={styles.qrCardTitle}>Invite Members</Text>
              </View>
              <Text style={styles.qrCardDescription}>
                Use this link when someone wants to register as your referral.
              </Text>

              <Text style={styles.qrTopLabel}>Signup referral QR code</Text>

              <View style={styles.qrMain}>
                <TouchableOpacity
                  style={styles.qrImageWrapper}
                  activeOpacity={0.7}
                  onPress={() => setEnlargedQR('signup')}
                >
                  <Image
                    source={{ uri: `https://quickchart.io/qr?text=${encodeURIComponent(signupUrl)}&size=200` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={styles.qrImageTag}>
                    <Text style={styles.qrImageTagText}>Signup</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrLabel}>Member signup link</Text>
                  <View style={styles.qrLinkBox}>
                    <Text style={styles.qrLinkText} numberOfLines={2}>{signupUrl}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrActions}>
                <PrimaryButton
                  title="Share"
                  icon="share-social"
                  onPress={() => handleShare(signupUrl, 'signup')}
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="Copy Link"
                  icon="copy-outline"
                  onPress={() => handleCopy(signupUrl)}
                  color={Colors.sky}
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            <View style={styles.qrSeparator} />

            {/* Shopping QR Section */}
            <View style={styles.qrCard}>
              <View style={styles.qrCardHeader}>
                <View style={[styles.qrIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="cart" size={16} color="#16a34a" />
                </View>
                <Text style={styles.qrCardTitle}>Share Shopping Link</Text>
              </View>
              <Text style={styles.qrCardDescription}>
                Use this link for non-members who only want to shop. Their checkout will carry your referral automatically.
              </Text>

              <Text style={[styles.qrTopLabel, { color: '#16a34a' }]}>Shopping referral QR code</Text>

              <View style={styles.qrMain}>
                <TouchableOpacity
                  style={styles.qrImageWrapper}
                  activeOpacity={0.7}
                  onPress={() => setEnlargedQR('shopping')}
                >
                  <Image
                    source={{ uri: `https://quickchart.io/qr?text=${encodeURIComponent(shoppingUrl)}&size=200` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={[styles.qrImageTag, { backgroundColor: '#16a34a' }]}>
                    <Text style={styles.qrImageTagText}>Shopping</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrLabel}>Shopping referral link</Text>
                  <View style={styles.qrLinkBox}>
                    <Text style={styles.qrLinkText} numberOfLines={2}>{shoppingUrl}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrActions}>
                <PrimaryButton
                  title="Share"
                  icon="share-social"
                  onPress={() => handleShare(shoppingUrl, 'shopping')}
                  style={{ backgroundColor: '#16a34a', flex: 1 }}
                />
                <OutlineButton
                  title="Copy Link"
                  icon="copy-outline"
                  onPress={() => handleCopy(shoppingUrl)}
                  color="#16a34a"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.key === 'logout') onLogout?.();
                if (item.key === 'settings') onNavigateSettings?.();
              }}
            >
              <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.danger ? Colors.error : Colors.sky}
                />
              </View>
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                {item.label}
              </Text>
              {item.chevron && (
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Connect with Us */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>Connect with Us</Text>
          </View>
          <View style={styles.purchasesGrid}>
            {SOCIAL_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.purchaseItem}
                activeOpacity={0.7}
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <View style={styles.purchaseIconContainer}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.purchaseLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Enlarged QR Modal */}
      <Modal
        visible={enlargedQR !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlargedQR(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setEnlargedQR(null)}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>

            <Image
              source={{
                uri: enlargedQR === 'signup'
                  ? `https://quickchart.io/qr?text=${encodeURIComponent(signupUrl)}&size=400`
                  : `https://quickchart.io/qr?text=${encodeURIComponent(shoppingUrl)}&size=400`,
              }}
              style={styles.modalQrImage}
              resizeMode="contain"
            />

            <Text style={styles.modalQrUrl}>
              {enlargedQR === 'signup' ? signupUrl : shoppingUrl}
            </Text>

            <PrimaryButton
              title={enlargedQR === 'signup' ? 'Share Signup Link' : 'Share Shopping Link'}
              icon="share-social"
              onPress={() => {
                const url = enlargedQR === 'signup' ? signupUrl : shoppingUrl;
                handleShare(url, enlargedQR);
              }}
              style={{ marginTop: 20, width: '80%' }}
            />
          </View>
        </View>
      </Modal>

      {/* Referral Network Screen */}
      {showReferralNetwork && (
        <View style={styles.referralNetworkOverlay}>
          <ReferralNetworkScreen
            token={token}
            tree={referralTree}
            onBack={() => setShowReferralNetwork(false)}
          />
        </View>
      )}

      {/* Profile Details Screen */}
      {showProfileDetails && (
        <View style={styles.profileDetailsOverlay}>
          <ProfileDetailsScreen
            token={token}
            cartCount={cartCount}
            onClose={() => setShowProfileDetails(false)}
            onCartPress={onCartPress}
          />
        </View>
      )}
    </View>

    {/* Chat Bot Icon */}
    <ChatBotIcon position="bottom-right" visible={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.sky,
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  headerAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
  },
  headerNameContainer: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  profileIcon: {
    marginLeft: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    height: 18,
  },
  badgeImageSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  usernameText: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: '600',
  },
  usernameDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
  },
  usernamePvText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 11,
  },

  // ── Body ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    gap: 16,
    paddingBottom: 32,
  },

  // ── Hero ──
  hero: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    marginBottom: 4,
  },
  heroBubbleImg: {
    width: '100%',
    height: '100%',
  },
  heroBubbleInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },

  // ── My Purchases ──
  purchasesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  purchasesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  purchasesViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  purchasesViewAllText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  purchasesGrid: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
    justifyContent: 'flex-start',
  },
  purchaseItem: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  purchaseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
  },
  referralValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginTop: -2,
  },

  // ── My Referrals ──
  referralsGrid: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  referralItem: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  referralIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  referralItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  // ── QR Section ──
  qrSubtitle: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: '600',
    marginTop: 2,
  },
  qrContainer: {
    padding: 16,
    gap: 20,
  },
  qrCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  qrIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  qrCardDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  qrTopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sky,
    marginBottom: 12,
    marginLeft: 16,
    marginRight: 16,
  },
  qrMain: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImageWrapper: {
    width: 100,
    height: 100,
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  qrImageTag: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qrImageTagText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  qrInfo: {
    flex: 1,
    gap: 4,
  },
  qrLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  qrLinkBox: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  qrLinkText: {
    fontSize: 10,
    color: Colors.sky,
    fontWeight: '600',
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  qrSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },

  // ── Menu ──
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#fee2e2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  menuLabelDanger: {
    color: Colors.error,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalQrImage: {
    width: 280,
    height: 280,
    marginTop: 16,
    marginBottom: 20,
  },
  modalQrUrl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── Profile Details Overlay ──
  profileDetailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },

  // ── Referral Network Overlay ──
  referralNetworkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },
});
