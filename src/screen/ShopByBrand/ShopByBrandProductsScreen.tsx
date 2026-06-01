import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ShopByBrandProductsScreenProps {
  isDarkMode?: boolean;
}

export default function ShopByBrandProductsScreen({
  isDarkMode = false,
}: ShopByBrandProductsScreenProps) {
  const themeColors = {
    text: isDarkMode ? '#f1f5f9' : Colors.text,
    textSecondary: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    sectionBg: isDarkMode ? '#0f172a' : '#f5f5f5',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.sectionBg }]}>
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color={themeColors.textSecondary} />
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
