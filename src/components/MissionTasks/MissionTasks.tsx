import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
}

interface MissionTasksProps {
  isDarkMode?: boolean;
}

const DAILY_MISSIONS: Mission[] = [
  {
    id: 'daily_1',
    title: 'Check In Today',
    description: 'Open the app and complete daily check-in',
    reward: 50,
    progress: 0,
    target: 1,
    completed: true,
    icon: 'log-in',
  },
  {
    id: 'daily_2',
    title: 'Share Products',
    description: 'Share any product with friends',
    reward: 100,
    progress: 0,
    target: 1,
    completed: false,
    icon: 'share-social',
  },
  {
    id: 'daily_3',
    title: 'Make a Purchase',
    description: 'Buy 1 item today',
    reward: 150,
    progress: 0,
    target: 1,
    completed: true,
    icon: 'bag-handle',
  },
  {
    id: 'daily_4',
    title: 'Invite Friends',
    description: 'Invite 1 friend to join the app',
    reward: 200,
    progress: 0,
    target: 1,
    completed: false,
    icon: 'people-outline',
  },
  {
    id: 'daily_5',
    title: 'Browse Items',
    description: 'View any item for 30 seconds',
    reward: 50,
    progress: 0,
    target: 1,
    completed: true,
    icon: 'eye-outline',
  },
];

const WEEKLY_MISSIONS: Mission[] = [
  {
    id: 'weekly_1',
    title: 'Spend 2000 PV',
    description: 'Accumulate spending of 2000 PV this week',
    reward: 500,
    progress: 0,
    target: 2000,
    completed: false,
    icon: 'cash',
  },
  {
    id: 'weekly_2',
    title: 'Complete 5 Purchases',
    description: 'Buy items 5 times in a week',
    reward: 600,
    progress: 0,
    target: 5,
    completed: false,
    icon: 'checkmark-done',
  },
  {
    id: 'weekly_3',
    title: 'Invite 3 Friends',
    description: 'Invite 3 new members to your network',
    reward: 800,
    progress: 0,
    target: 3,
    completed: false,
    icon: 'people',
  },
  {
    id: 'weekly_4',
    title: 'Share 5 Products',
    description: 'Share 5 different products with friends',
    reward: 400,
    progress: 0,
    target: 5,
    completed: false,
    icon: 'share-outline',
  },
];

const MissionCard = ({ mission, isDarkMode }: { mission: Mission; isDarkMode: boolean }) => {
  const colors = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#334155' : '#e5e7eb',
    progressBg: isDarkMode ? '#334155' : '#e5e7eb',
  };

  const progressPercentage = Math.min((mission.progress / mission.target) * 100, 100);
  const isCompleted = mission.completed;

  return (
    <View
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Left Icon */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: Colors.sky + '10',
          },
        ]}
      >
        <Ionicons name={mission.icon as any} size={28} color={Colors.sky} />
      </View>

      {/* Middle Content */}
      <View style={styles.contentBox}>
        <Text style={[styles.missionTitle, { color: colors.text }]} numberOfLines={1}>
          {mission.title}
        </Text>
        <Text style={[styles.missionDescription, { color: colors.textSec }]} numberOfLines={1}>
          {mission.description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: colors.progressBg,
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: Colors.sky,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSec }]}>
            {mission.progress}/{mission.target}
          </Text>
        </View>
      </View>

      {/* Right Reward */}
      <View style={styles.rightBox}>
        <View style={styles.rewardBox}>
          <Text style={styles.rewardText}>+{mission.reward}</Text>
          <Text style={styles.pvText}>PV</Text>
        </View>
      </View>
    </View>
  );
};

export default function MissionTasks({ isDarkMode = false }: MissionTasksProps) {
  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  return (
    <View style={{ gap: 8 }}>
      {/* Daily Missions Section */}
      <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar-today" size={18} color={Colors.sky} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Missions</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{DAILY_MISSIONS.filter(m => m.completed).length}/{DAILY_MISSIONS.length}</Text>
          </View>
        </View>

        <View style={styles.missionsContainer}>
          {DAILY_MISSIONS.map((mission, index) => (
            <View key={mission.id}>
              <MissionCard mission={mission} isDarkMode={isDarkMode} />
              {index < DAILY_MISSIONS.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Weekly Missions Section */}
      <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={18} color={Colors.sky} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Missions</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{WEEKLY_MISSIONS.filter(m => m.completed).length}/{WEEKLY_MISSIONS.length}</Text>
          </View>
        </View>

        <View style={styles.missionsContainer}>
          {WEEKLY_MISSIONS.map((mission, index) => (
            <View key={mission.id}>
              <MissionCard mission={mission} isDarkMode={isDarkMode} />
              {index < WEEKLY_MISSIONS.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.borderLight },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.sky + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sky,
  },
  missionsContainer: {
    padding: 8,
    gap: 0,
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    flex: 1,
    gap: 6,
  },
  missionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  missionDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  progressContainer: {
    gap: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
  rightBox: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rewardBox: {
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.sky,
    lineHeight: 16,
  },
  pvText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.sky,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 8,
  },
});
