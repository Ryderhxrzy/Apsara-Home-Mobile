import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Clipboard,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import Button from '../components/Button/PrimaryButton';
import { authService } from '../services/authService';
import RNGetSmsAndroid from 'react-native-get-sms-android';

interface ReferralOtpScreenProps {
  phone: string;
  verificationToken: string;
  isDarkMode?: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ReferralOtpScreen({
  phone,
  verificationToken,
  isDarkMode = false,
  onBack,
  onSuccess,
}: ReferralOtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes in seconds (matches SMS OTP expiration)
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [resendLoading, setResendLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn(seconds => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-fill OTP from SMS (Android) or clipboard
  useEffect(() => {
    const autoFillOtp = async () => {
      try {
        // For Android, try to read SMS first
        if (Platform.OS === 'android') {
          const permission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
              title: 'AF Home SMS Permission',
              message: 'AF Home needs permission to read SMS for auto-filling OTP',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (permission === PermissionsAndroid.RESULTS.GRANTED) {
            try {
              const messages = await RNGetSmsAndroid.getAll();
              const otpMessages = messages.filter((msg: any) =>
                msg.body && (msg.body.includes('AF Home') || msg.body.includes('OTP') || msg.body.includes('verification'))
              );

              if (otpMessages.length > 0) {
                const latestMsg = otpMessages[0];
                const otpMatch = latestMsg.body.match(/\d{4}/);

                if (otpMatch) {
                  const otpCode = otpMatch[0];
                  const digits = otpCode.split('');
                  setOtp(digits as [string, string, string, string]);
                  Toast.show({
                    type: 'success',
                    text1: 'OTP Auto-filled',
                    text2: 'Code detected from SMS',
                  });
                  console.log('[OTPScreen] OTP auto-filled from SMS:', otpCode);
                  return;
                }
              }
            } catch (smsError) {
              console.log('[OTPScreen] SMS reading error:', smsError);
            }
          }
        }

        // Fallback to clipboard
        const clipboardText = await Clipboard.getString();
        if (clipboardText && /^\d{4}$/.test(clipboardText.trim())) {
          const digits = clipboardText.trim().split('');
          setOtp(digits as [string, string, string, string]);
          Toast.show({
            type: 'success',
            text1: 'OTP Auto-filled',
            text2: 'Code detected from clipboard',
          });
          console.log('[OTPScreen] OTP auto-filled from clipboard:', clipboardText);
        }
      } catch (error) {
        console.log('[OTPScreen] Auto-fill error:', error);
      }
    };

    autoFillOtp();
  }, []);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f8fbff',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setErrorMessage('Please enter all 4 digits.');
      return;
    }

    if (expiresIn === 0) {
      setErrorMessage('OTP has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await authService.verifySmsOtp(verificationToken, otpCode);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Phone number verified successfully!',
      });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      const status = error.status;
      const errorCode = error.error;

      if (status === 410 && errorCode === 'OTP_EXPIRED') {
        setErrorMessage('The verification code has expired. Please request a new OTP.');
      } else if (status === 429 && errorCode === 'MAX_ATTEMPTS_EXCEEDED') {
        setErrorMessage('Too many failed attempts. Please request a new OTP.');
        setAttemptsRemaining(0);
      } else if (status === 422 && errorCode === 'INVALID_OTP') {
        const remaining = error.attempts_remaining ?? 0;
        setAttemptsRemaining(remaining);
        setErrorMessage(`Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      } else {
        setErrorMessage(error.message || 'OTP verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setErrorMessage('');
    try {
      await authService.resendSmsOtp(verificationToken, phone);
      setOtp(['', '', '', '']);
      setExpiresIn(600); // Reset to 10 minutes
      setAttemptsRemaining(5); // Reset attempts
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new 4-digit verification code has been sent to your phone.',
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.containerBg }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerGreeting, { color: colors.text }]}>
              Verify Account
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSec }]}>
              Enter the 4-digit code
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >


          {/* OTP Input Boxes */}
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Enter Verification Code</Text>
            <Text style={[styles.expiryText, { color: expiresIn < 60 ? '#ef4444' : colors.textSec }]}>
              Expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  {
                    borderColor: digit ? Colors.sky : colors.border,
                    backgroundColor: colors.containerBg,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                maxLength={1}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSec}
                placeholder="-"
              />
            ))}
          </View>

          {/* Error Message */}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textSec }]}>Didn't receive code?</Text>
            <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading || attemptsRemaining === 0}>
              <Text style={[
                styles.resendLink,
                { color: (resendLoading || attemptsRemaining === 0) ? colors.border : Colors.sky },
                (resendLoading || attemptsRemaining === 0) && styles.resendLinkDisabled
              ]}>
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <Button
            title="VERIFY"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 900,
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 12,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 12,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  verifyBtn: {
    marginBottom: 16,
  },
  spacer: {
    height: 40,
  },
});
