import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Text,
  ScrollView,
  BackHandler,
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['left', 'right', 'bottom']}>
      {/* Header with Background Image */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Image
          source={require('../../assets/pv_earner_bg.png')}
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: Colors.white }]}>PV Earner</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Daily Check-In */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <DailyCheckin
          isDarkMode={isDarkMode}
          onViewMore={onBack}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 90,
    borderBottomWidth: 1,
  },
  headerBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },
});
