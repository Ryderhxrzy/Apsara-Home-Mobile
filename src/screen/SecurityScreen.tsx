import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, BackHandler, TextInput, Alert, ActivityIndicator, Animated, Linking, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import GoogleSignInService from '../services/googleSignInService';
import BiometricUtils from '../utils/biometricUtils';

interface SecurityScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
  token?: string | null;
  onGoogleLinked?: () => void;
}

interface Passkey {
  id: string;
  name: string;
  created_at?: string;
}

export default function SecurityScreen({ onBack, isDarkMode, token, onGoogleLinked }: SecurityScreenProps) {
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
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loadingBiometric, setLoadingBiometric] = useState(false);;

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
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    if (token) {
      fetchPasskeys();
      fetchGoogleLinkedStatus();
    }
  }, [token]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

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

  const fetchGoogleLinkedStatus = async () => {
    if (!token) return;
    try {
      console.log('[SecurityScreen] Fetching Google linked status');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_CONFIG.BASE_URL}/auth/mobile/check-google-linked`, { headers });
      console.log('[SecurityScreen] Google linked status response:', res.data);

      if (res.data?.linked) {
        setGoogleLinked(true);
        // Optionally fetch the account email if available
        if (res.data?.provider_data?.email) {
          setGoogleAccount({ email: res.data.provider_data.email });
        }
      } else {
        setGoogleLinked(false);
      }
    } catch (error) {
      console.error('[SecurityScreen] Error fetching Google linked status:', error);
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

  const handleLinkGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        Alert.alert('Error', 'Google Client ID not configured');
        return;
      }

      await GoogleSignInService.initialize({
        webClientId: googleClientId,
      });

      const userInfo = await GoogleSignInService.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token');
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Authentication token missing');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const payload = { id_token: idToken };

      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/mobile/link-account`, payload, { headers });

      const currentUser = await GoogleSignInService.getCurrentUser();
      setGoogleAccount(currentUser?.data?.user);
      setGoogleLinked(true);
      onGoogleLinked?.();

      Alert.alert('Success', 'Account linked successfully');
    } catch (error: any) {
      if (error.message?.includes('cancelled')) {
        return;
      }
      const errorMsg = error.response?.data?.message || error.message || 'Failed to link account';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const available = await BiometricUtils.isBiometricAvailable();
      const enrolled = await BiometricUtils.isBiometricEnrolled();
      const hasCredential = await BiometricUtils.hasBiometricCredential();

      setBiometricAvailable(available && enrolled);
      setBiometricEnabled(hasCredential);
    } catch (error) {
      console.error('Error checking biometric:', error);
    }
  };

  const handleEnableBiometric = async () => {
    setLoadingBiometric(true);
    try {
      console.log('[SecurityScreen] Starting biometric enable process');

      if (!token) {
        console.error('[SecurityScreen] Token missing');
        Alert.alert('Error', 'Authentication token missing');
        return;
      }

      console.log('[SecurityScreen] Token verified, triggering biometric prompt');
      // Authenticate with biometric first
      const authenticated = await BiometricUtils.authenticate();
      if (!authenticated) {
        console.error('[SecurityScreen] Biometric authentication cancelled by user');
        Alert.alert('Error', 'Biometric authentication cancelled');
        return;
      }

      console.log('[SecurityScreen] Biometric authentication successful');
      // Generate device ID and get device name
      const deviceId = BiometricUtils.generateDeviceId();
      const deviceName = BiometricUtils.getDeviceName();
      console.log('[SecurityScreen] Device ID generated', { deviceId, deviceName, platform: Platform.OS });

      // Call backend to enable biometric
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        device_id: deviceId,
        device_name: deviceName,
        device_type: Platform.OS,
      };

      console.log('[SecurityScreen] Calling backend API', { endpoint: `${API_CONFIG.BASE_URL}/auth/mobile/enable-biometric`, payload });
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/mobile/enable-biometric`,
        payload,
        { headers }
      );

      console.log('[SecurityScreen] API response received', { status: response.status, data: response.data });

      if (response.data?.credential_token) {
        console.log('[SecurityScreen] Credential token received, saving to keychain');
        // Save credential to keychain
        const saved = await BiometricUtils.saveBiometricCredential({
          credential_token: response.data.credential_token,
          device_id: deviceId,
          device_name: deviceName,
        });

        if (saved) {
          console.log('[SecurityScreen] Credential saved successfully');
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          console.error('[SecurityScreen] Failed to save credential to keychain');
          Alert.alert('Error', 'Failed to save biometric credential to device. Please try again.');
        }
      } else {
        console.error('[SecurityScreen] No credential token in response', { response: response.data });
        Alert.alert('Error', 'Invalid response from server. No credential token received.');
      }
    } catch (error: any) {
      console.error('[SecurityScreen] Error in biometric enable', {
        errorType: error.constructor.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });

      let errorMsg = 'Failed to enable biometric';

      if (error.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 409) {
        errorMsg = 'This device is already registered for biometric login.';
      } else if (error.response?.status === 422) {
        errorMsg = `Validation error: ${error.response?.data?.errors?.[0] || error.response?.data?.message || 'Invalid data'}`;
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later or contact support.';
      } else if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMsg = 'Cannot reach the server. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      Alert.alert('Error', errorMsg);
    } finally {
      setLoadingBiometric(false);
    }
  };

  const handleDisableBiometric = () => {
    Alert.alert('Disable Biometric', 'Are you sure you want to disable biometric login?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Disable',
        onPress: async () => {
          setLoadingBiometric(true);
          try {
            console.log('[SecurityScreen] Starting biometric disable process');

            if (!token) {
              console.error('[SecurityScreen] Token missing for disable');
              Alert.alert('Error', 'Authentication token missing');
              return;
            }

            console.log('[SecurityScreen] Retrieving credential from keychain');
            const credential = await BiometricUtils.getBiometricCredential();
            if (!credential) {
              console.error('[SecurityScreen] No credential found in keychain');
              Alert.alert('Error', 'Biometric credential not found on device');
              return;
            }

            console.log('[SecurityScreen] Credential retrieved, calling backend', { device_id: credential.device_id });
            const headers = { Authorization: `Bearer ${token}` };
            const payload = { device_id: credential.device_id };

            const response = await axios.post(
              `${API_CONFIG.BASE_URL}/auth/mobile/disable-biometric`,
              payload,
              { headers }
            );

            console.log('[SecurityScreen] Backend disable successful, deleting keychain credential');
            // Delete credential from keychain
            const deleted = await BiometricUtils.deleteBiometricCredential();
            if (deleted) {
              console.log('[SecurityScreen] Keychain credential deleted');
            } else {
              console.warn('[SecurityScreen] Failed to delete keychain credential, but backend was disabled');
            }

            setBiometricEnabled(false);
            Alert.alert('Success', 'Biometric authentication disabled');
          } catch (error: any) {
            console.error('[SecurityScreen] Error in biometric disable', {
              errorType: error.constructor.name,
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
            });

            let errorMsg = 'Failed to disable biometric';

            if (error.response?.status === 401) {
              errorMsg = 'Your session has expired. Please log in again.';
            } else if (error.response?.status === 500) {
              errorMsg = 'Server error. Please try again later.';
            } else if (error.response?.data?.message) {
              errorMsg = error.response.data.message;
            } else if (error.message) {
              errorMsg = error.message;
            }

            Alert.alert('Error', errorMsg);
          } finally {
            setLoadingBiometric(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleUnlinkGoogle = () => {
    Alert.alert('Unlink Account', 'Are you sure you want to unlink your account?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Unlink',
        onPress: async () => {
          setLoadingGoogle(true);
          try {
            if (!token) {
              Alert.alert('Error', 'Authentication token missing');
              return;
            }

            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_CONFIG.BASE_URL}/auth/mobile/unlink-account`, {}, { headers });

            setGoogleLinked(false);
            setGoogleAccount(null);
            onGoogleLinked?.();
            Alert.alert('Success', 'Account unlinked successfully');
          } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to unlink account';
            Alert.alert('Error', errorMsg);
          } finally {
            setLoadingGoogle(false);
          }
        },
        style: 'destructive',
      },
    ]);
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

        {/* Biometric Authentication */}
        {biometricAvailable && (
          <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
            <View style={styles.sectionTitle}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>Biometric Login</Text>
              <Text style={[styles.sectionTitleDescription, { color: colors.textSec }]}>Use Face ID, Touch ID, or Fingerprint to sign in quickly and securely.</Text>
            </View>

            <View style={[styles.accountItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.accountItemLeft}>
                <View style={[styles.accountIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="finger-print" size={20} color={Colors.sky} />
                </View>
                <View>
                  <Text style={[styles.accountName, { color: colors.text }]}>Biometric Authentication</Text>
                  {biometricEnabled ? (
                    <Text style={[styles.accountEmail, { color: colors.textSec }]}>Enabled</Text>
                  ) : (
                    <Text style={[styles.accountEmail, { color: colors.textSec }]}>Not enabled</Text>
                  )}
                </View>
              </View>
              <View style={styles.accountStatus}>
                {biometricEnabled ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                    <Text style={[styles.statusBadgeText, { color: '#22c55e' }]}>Enabled</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="close-circle" size={14} color="#ef4444" />
                    <Text style={[styles.statusBadgeText, { color: '#ef4444' }]}>Disabled</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.accountActionsContainer}>
              {biometricEnabled ? (
                <TouchableOpacity
                  style={[styles.accountButton, { borderColor: '#ef4444' }]}
                  onPress={handleDisableBiometric}
                  disabled={loadingBiometric}
                >
                  {loadingBiometric && <ActivityIndicator color="#ef4444" style={{ marginRight: 8 }} />}
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.accountButtonText, { color: '#ef4444' }]}>Disable Biometric</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.accountButton, { backgroundColor: '#f97316' }]}
                  onPress={handleEnableBiometric}
                  disabled={loadingBiometric}
                >
                  {loadingBiometric && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
                  <Ionicons name="finger-print" size={16} color="#fff" />
                  <Text style={[styles.accountButtonText, { color: '#fff' }]}>Enable Biometric</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Connected Accounts */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <View style={styles.sectionTitle}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Connected Accounts</Text>
            <Text style={[styles.sectionTitleDescription, { color: colors.textSec }]}>Manage your connected social accounts for quick login.</Text>
          </View>

          <View style={[styles.accountItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.accountItemLeft}>
              <View style={[styles.accountIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="logo-google" size={20} color="#ef4444" />
              </View>
              <View>
                <Text style={[styles.accountName, { color: colors.text }]}>Google</Text>
                {googleLinked && googleAccount ? (
                  <Text style={[styles.accountEmail, { color: colors.textSec }]}>{googleAccount.email}</Text>
                ) : (
                  <Text style={[styles.accountEmail, { color: colors.textSec }]}>Not connected</Text>
                )}
              </View>
            </View>
            <View style={styles.accountStatus}>
              {googleLinked ? (
                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={[styles.statusBadgeText, { color: '#22c55e' }]}>Connected</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="close-circle" size={14} color="#ef4444" />
                  <Text style={[styles.statusBadgeText, { color: '#ef4444' }]}>Not connected</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.accountActionsContainer}>
            {googleLinked ? (
              <TouchableOpacity
                style={[styles.accountButton, { borderColor: '#ef4444' }]}
                onPress={handleUnlinkGoogle}
                disabled={loadingGoogle}
              >
                {loadingGoogle && <ActivityIndicator color="#ef4444" style={{ marginRight: 8 }} />}
                <Ionicons name="unlink" size={16} color="#ef4444" />
                <Text style={[styles.accountButtonText, { color: '#ef4444' }]}>Unlink Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.accountButton, { backgroundColor: '#f97316' }]}
                onPress={handleLinkGoogle}
                disabled={loadingGoogle}
              >
                {loadingGoogle && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
                <Ionicons name="link" size={16} color="#fff" />
                <Text style={[styles.accountButtonText, { color: '#fff' }]}>Link Account</Text>
              </TouchableOpacity>
            )}
          </View>
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
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  accountStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  accountActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  accountButton: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
