import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, BackHandler, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface SettingsScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  onNavigateSecurity: () => void;
}

export default function SettingsScreen({ onBack, isDarkMode, setIsDarkMode, onNavigateSecurity }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;

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
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#f8fafc' : Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={[styles.scroll, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}>
              <Ionicons name="moon-outline" size={20} color={Colors.sky} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#e2e8f0', true: Colors.sky }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Security Menu Item */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.borderLight }]} onPress={onNavigateSecurity}>
            <View style={[styles.settingIcon, { backgroundColor: colors.cardBg }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.sky} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Security</Text>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
