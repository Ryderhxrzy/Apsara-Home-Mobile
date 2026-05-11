import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { orderService } from '../services/orderService';
import { ChatBotIcon } from '../components/ChatBot';

interface NotificationsScreenProps {
  token?: string | null;
  isDarkMode?: boolean;
  onNavigateToPurchases?: (status: string) => void;
}

export default function NotificationsScreen({ token, onBack, isDarkMode = false, onNavigateToPurchases }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f0f9ff',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    emptyIcon: isDarkMode ? '#0284c7' : Colors.sky,
    unreadBg: isDarkMode ? '#374151' : '#f8f8f8',
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await orderService.getNotifications(token);
      setNotifications(data);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'info':
      default:
        return Colors.sky;
    }
  };

  const getSeverityIcon = (severity: string): any => {
    switch (severity) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };

  const getFilteredNotifications = () => {
    if (!notifications?.notifications) return [];
    if (filterType === 'all') return notifications.notifications;
    if (filterType === 'unread') return notifications.notifications.filter((item: any) => !item.is_read);
    if (filterType === 'read') return notifications.notifications.filter((item: any) => item.is_read);
    return notifications.notifications;
  };

  const handleNotificationPress = (href?: string) => {
    if (!href) return;

    // Parse deep link format: purchases://status
    const deepLinkRegex = /^purchases:\/\/(.+)$/;
    const match = href.match(deepLinkRegex);

    if (match && match[1]) {
      const status = match[1];
      onNavigateToPurchases?.(status);
    }
  };

  const totalNotifications = notifications?.unread_count || 0;

  return (
    <View style={styles.root}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.titleSection, { backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
            {totalNotifications > 0 && (
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{totalNotifications}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.filterSection, { backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'all' && { backgroundColor: Colors.sky, borderColor: Colors.sky },
              filterType !== 'all' && { borderColor: colors.border },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'all' ? { color: Colors.white } : { color: colors.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'unread' && { backgroundColor: Colors.sky, borderColor: Colors.sky },
              filterType !== 'unread' && { borderColor: colors.border },
            ]}
            onPress={() => setFilterType('unread')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'unread' ? { color: Colors.white } : { color: colors.text },
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'read' && { backgroundColor: Colors.sky, borderColor: Colors.sky },
              filterType !== 'read' && { borderColor: colors.border },
            ]}
            onPress={() => setFilterType('read')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'read' ? { color: Colors.white } : { color: colors.text },
              ]}
            >
              Read
            </Text>
          </TouchableOpacity>
        </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.emptyIcon} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {notifications?.notifications && notifications.notifications.length > 0 ? (
            (() => {
              const filtered = getFilteredNotifications();
              return filtered.length > 0 ? filtered.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationItem,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: !item.is_read ? colors.unreadBg : 'transparent',
                  },
                  index !== notifications.notifications.length - 1 && styles.notificationItemBorder,
                ]}
                onPress={() => handleNotificationPress(item.href)}
                activeOpacity={0.7}
              >
                {item.product_image ? (
                  <View style={[styles.notificationImageBox, { backgroundColor: colors.borderLight }]}>
                    <Image
                      source={{ uri: item.product_image }}
                      style={styles.notificationImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.notificationIconBox,
                      { backgroundColor: getSeverityColor(item.severity) },
                    ]}
                  >
                    <Ionicons
                      name={getSeverityIcon(item.severity)}
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                )}
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeaderRow}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.notificationTime, { color: colors.textSec }]}>{formatDate(item.created_at)}</Text>
                  </View>
                  <Text style={[styles.notificationDescription, { color: colors.textSec }]}>{item.message}</Text>
                  {item.amount > 0 && (
                    <Text style={[styles.notificationAmount, { color: colors.emptyIcon }]}>
                      Amount: ₱{item.amount.toLocaleString()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              )) : (
                    <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color={colors.emptyIcon} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSec }]}>You have no new notifications</Text>
                </View>
              );
            })()
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSec }]}>You have no new notifications</Text>
            </View>
          )}
        </ScrollView>
      )}
      </View>

      {/* Chat Bot Icon */}
      <ChatBotIcon position="bottom-right" visible={true} isDarkMode={isDarkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  totalBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
  },
  notificationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  notificationDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  notificationCount: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: '600',
    marginTop: 2,
  },
  notificationImageBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  notificationImage: {
    width: '100%',
    height: '100%',
  },
  notificationAmount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
