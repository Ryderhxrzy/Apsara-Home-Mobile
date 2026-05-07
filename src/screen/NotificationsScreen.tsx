import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { orderService } from '../services/orderService';
import { ChatBotIcon } from '../components/ChatBot';

interface NotificationsScreenProps {
  token?: string | null;
}

export default function NotificationsScreen({ token, onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const totalNotifications = notifications?.items?.length || 0;

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {totalNotifications > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{totalNotifications}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {notifications?.items && notifications.items.length > 0 ? (
            notifications.items.map((item: any, index: number) => (
              <View
                key={item.id}
                style={[
                  styles.notificationItem,
                  index !== notifications.items.length - 1 && styles.notificationItemBorder,
                ]}
              >
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
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>{item.description}</Text>
                  {item.count > 0 && (
                    <Text style={styles.notificationCount}>
                      ({item.count} update{item.count !== 1 ? 's' : ''})
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.sky} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyDescription}>You have no new notifications</Text>
            </View>
          )}
        </ScrollView>
      )}
      </View>

      {/* Chat Bot Icon */}
      <ChatBotIcon position="bottom-right" visible={true} />
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
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
