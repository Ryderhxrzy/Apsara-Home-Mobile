import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, BackHandler, TextInput, Alert, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { API_CONFIG } from '../config/api';
import axios from 'axios';

interface SecurityScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
  token?: string | null;
}

interface Passkey {
  id: string;
  name: string;
  created_at?: string;
}

export default function SecurityScreen({ onBack, isDarkMode, token }: SecurityScreenProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passKeyName, setPassKeyName] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);;

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f0f9ff',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Animated.spring(slideAnim, {
        toValue: 100,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => onBack());
      return true;
    });
    return () => backHandler.remove();
  }, [onBack, slideAnim]);

  useEffect(() => {
    if (token) {
      fetchPasskeys();
    }
  }, [token]);

  const fetchPasskeys = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/passkeys`, { headers });
      setPasskeys(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching passkeys:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    // Validate password strength
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUppercase) {
      Alert.alert('Error', 'New password must include at least one uppercase letter');
      return;
    }
    if (!hasLowercase) {
      Alert.alert('Error', 'New password must include at least one lowercase letter');
      return;
    }
    if (!hasNumber) {
      Alert.alert('Error', 'New password must include at least one number');
      return;
    }
    if (!hasSpecialChar) {
      Alert.alert('Error', 'New password must include at least one special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    setLoadingPassword(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      };

      await axios.post(`${API_CONFIG.BASE_URL}/auth/change-password`, payload, { headers });

      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message
        || error.response?.data?.error
        || 'Failed to change password';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleAddPasskey = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoadingPasskey(true);
    try {
      const passkeyName = passKeyName || `Passkey ${passkeys.length + 1}`;
      const encodedName = encodeURIComponent(passkeyName);
      const webUrl = `${API_CONFIG.BASE_URL.replace('/api', '')}/auth/passkey-register?token=${token}&name=${encodedName}`;

      await Linking.openURL(webUrl);

      setPassKeyName('');
      setTimeout(() => fetchPasskeys(), 2000);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to open passkey registration. Please try again.');
    } finally {
      setLoadingPasskey(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Sign Out',
        onPress: () => {
          onBack();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure? This action cannot be undone. All your data will be permanently deleted.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          Alert.alert('Account Deleted', 'Your account has been permanently deleted');
          onBack();
        },
        style: 'destructive',
      },
    ]);
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_CONFIG.BASE_URL}/auth/passkeys/${passkeyId}`, { headers });
      await fetchPasskeys();
      Alert.alert('Success', 'Passkey deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete passkey');
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 100],
              }),
            },
          ],
        },
      ]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={[]}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.header, { paddingTop: insets.top, backgroundColor: isDarkMode ? '#1f2937' : Colors.white, borderBottomColor: colors.border }]}
        >
          <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={24} color={isDarkMode ? '#e5e7eb' : Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Security</Text>
          <View style={{ width: 40 }} />
        </View>
        </LinearGradient>

        <ScrollView style={[styles.scroll, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Change Password */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <View style={styles.sectionTitle}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Change Password</Text>
            <Text style={[styles.sectionTitleDescription, { color: colors.textSec }]}>Use a strong, unique password for your account.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSec }]}>Current Password</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSec}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSec} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSec }]}>New Password</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.textSec}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSec} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSec }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSec}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSec} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.sky }]} onPress={handleChangePassword} disabled={loadingPassword}>
            {loadingPassword && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* Passkeys Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <View style={styles.sectionTitle}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Passkeys</Text>
            <Text style={[styles.sectionTitleDescription, { color: colors.textSec }]}>Add a passkey to sign in with Face ID, fingerprint, or device PIN.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSec }]}>Passkey name (optional, e.g. My iPhone)</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter a name..."
                placeholderTextColor={colors.textSec}
                value={passKeyName}
                onChangeText={setPassKeyName}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.sky }]} onPress={handleAddPasskey} disabled={loadingPasskey}>
            {loadingPasskey && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Add Passkey</Text>
          </TouchableOpacity>

          {passkeys.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSec }]}>No passkeys registered yet.</Text>
          ) : (
            <View style={styles.passkeysList}>
              {passkeys.map((passkey) => (
                <View key={passkey.id} style={[styles.passkeyItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.passkeyInfo}>
                    <Ionicons name="key" size={16} color={Colors.sky} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.passkeyName, { color: colors.text }]}>{passkey.name}</Text>
                      {passkey.created_at && (
                        <Text style={[styles.passkeyDate, { color: colors.textSec }]}>
                          Added {new Date(passkey.created_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeletePasskey(passkey.id)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection, { backgroundColor: colors.containerBg, borderColor: '#fecaca' }]}>
          <View style={styles.sectionTitle}>
            <Text style={[styles.sectionTitleText, styles.dangerText]}>Danger Zone</Text>
            <Text style={[styles.sectionTitleDescription, { color: colors.textSec }]}>These actions are irreversible. Please be certain before proceeding.</Text>
          </View>

          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <View style={styles.dangerButtonContent}>
              <View>
                <Text style={styles.dangerButtonLabel}>Sign Out</Text>
                <Text style={[styles.dangerButtonDescription, { color: colors.textSec }]}>Sign out from your account on this device.</Text>
              </View>
            </View>
            <Ionicons name="log-out" size={18} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dangerButton, { borderTopWidth: 0 }]} onPress={handleDeleteAccount}>
            <View style={styles.dangerButtonContent}>
              <View>
                <Text style={styles.dangerButtonLabel}>Delete Account</Text>
                <Text style={[styles.dangerButtonDescription, { color: colors.textSec }]}>Permanently remove your account and all data.</Text>
              </View>
            </View>
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -10,
    marginRight: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerTitleDark: {
    color: '#f8fafc',
  },
  content: {
    padding: 8,
    gap: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionTitleDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  inputGroup: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  button: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  passkeysList: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  passkeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  passkeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  passkeyName: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerSection: {
    borderColor: '#fecaca',
    marginBottom: 32,
  },
  dangerText: {
    color: '#ef4444',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
  },
  dangerButtonContent: {
    flex: 1,
  },
  dangerButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  dangerButtonDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  passkeyDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
