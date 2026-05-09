import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PaymentWebViewScreenProps {
  checkoutUrl: string;
  onBack?: () => void;
  onPaymentSuccess?: () => void;
  isDarkMode?: boolean;
}

export default function PaymentWebViewScreen({
  checkoutUrl,
  onBack,
  onPaymentSuccess,
  isDarkMode = false,
}: PaymentWebViewScreenProps) {
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    // Check if user has returned to success page
    if (navState.url.includes('success') || navState.url.includes('payment_success')) {
      setLoading(false);
      onPaymentSuccess?.();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back-outline" size={24} color={isDarkMode ? '#e5e7eb' : Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#f8fafc' : Colors.text }]}>
          Payment
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sky} />
          <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
            Loading payment page...
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={() => setLoading(false)}
        style={{ opacity: loading ? 0 : 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sky} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
});
