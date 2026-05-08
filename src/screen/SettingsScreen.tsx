
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Clipboard, Alert, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import * as Notifications from 'expo-notifications';

interface SettingsScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function SettingsScreen({ onBack, isDarkMode, setIsDarkMode }: SettingsScreenProps) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      try {
        const pushToken = await Notifications.getExpoPushTokenAsync();
        setDeviceToken(pushToken.data);
      } catch (error) {
        console.log('Error getting token:', error);
      }
    };
    getToken();
  }, []);

  const handleCopyToken = () => {
    if (deviceToken) {
      Clipboard.setString(deviceToken);
      Alert.alert('Copied!', 'Push token copied to clipboard');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="moon-outline" size={20} color={Colors.text} />
              </View>
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#e2e8f0', true: Colors.sky }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Dark mode is currently a preview feature. More settings will be available in future updates.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowTokenModal(true)}
          >
            <View style={styles.settingLabelContainer}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="notifications-outline" size={20} color={Colors.sky} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Push Token</Text>
                <Text style={styles.tokenPreview} numberOfLines={1}>
                  {deviceToken ? `${deviceToken.substring(0, 30)}...` : 'Loading...'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showTokenModal} transparent animationType="fade" onRequestClose={() => setShowTokenModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTokenModal(false)}>
          <Pressable style={styles.tokenModal} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Push Notification Token</Text>
              <TouchableOpacity onPress={() => setShowTokenModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.tokenBox}>
              <Text style={styles.tokenText} selectable>{deviceToken || 'Loading...'}</Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyToken}
            >
              <Ionicons name="copy" size={18} color={Colors.white} />
              <Text style={styles.copyButtonText}>Copy Token</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTokenModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tokenPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  tokenModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  tokenBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  copyButton: {
    backgroundColor: Colors.sky,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
});
