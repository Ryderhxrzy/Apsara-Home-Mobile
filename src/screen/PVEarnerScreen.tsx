import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import DailyCheckin from '../components/DailyCheckin/DailyCheckin';

interface PVEarnerScreenProps {
  isDarkMode: boolean;
  onBack: () => void;
  onDailyCheckin?: () => void;
}

export default function PVEarnerScreen({
  isDarkMode,
  onBack,
  onDailyCheckin,
}: PVEarnerScreenProps) {
  const insets = useSafeAreaInsets();

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    border: isDarkMode ? '#374151' : '#e5e7eb',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="flash-outline" size={20} color={Colors.sky} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Daily Check-In */}
      <View style={styles.checkinContainer}>
        <DailyCheckin
          isDarkMode={isDarkMode}
          onViewMore={onBack}
        />
      </View>
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinContainer: {
    flex: 1,
    padding: 12,
  },
});
