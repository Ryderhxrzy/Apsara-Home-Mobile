import { useEffect, useState, useCallback } from 'react';
import { pusherService } from '../services/pusherService';
import Toast from 'react-native-toast-message';
import { useTokenRefresh } from './useTokenRefresh';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  description: string;
  count?: number;
  severity: string;
  href: string;
  latest_at: string;
  order_id?: number;
  checkout_id?: string;
  status?: string;
  created_at: string;
}

export interface OrderStatusData {
  order_id: number;
  checkout_id: string;
  event_type: string;
  title: string;
  description: string;
  status: string;
  payment_status: string;
  tracking_number?: string;
  created_at: string;
}

export const useNotifications = (userId: string | number, token: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const { validateToken } = useTokenRefresh();

  useEffect(() => {
    if (!userId || !token) {
      console.log('[useNotifications] missing userId or token, skipping realtime setup', { userId, token: !!token });
      return;
    }

    let isMounted = true;

    const initializeNotifications = async () => {
      // First, validate the token
      console.log('[useNotifications] validating token before initializing Pusher...');
      const isTokenValid = await validateToken(token);

      if (!isMounted) return;

      if (!isTokenValid) {
        const msg = 'Token invalid or expired. Please login again.';
        console.error('[useNotifications]', msg);
        setAuthError(msg);
        return;
      }

      const channelName = `private-customer-${userId}`;
      console.log('[useNotifications] initializing realtime notifications', {
        channelName,
        tokenLength: token?.length,
        userId,
      });

      // Initialize Pusher
      pusherService.init(token);

      // Subscribe to customer's private channel
      const channel = pusherService.subscribe(channelName);
      console.log('[useNotifications] subscribed to channel', channelName);

      channel.bind('pusher:subscription_succeeded', () => {
        if (isMounted) {
          console.log('[useNotifications] ✅ pusher subscription succeeded for:', channelName);
          setAuthError(null);
        }
      });

      channel.bind('pusher:subscription_error', (error: any) => {
        if (isMounted) {
          console.error('[useNotifications] ❌ pusher subscription error:', {
            channel: channelName,
            status: error?.status,
            error: error?.error,
            type: error?.type,
          });
          
          if (error?.status === 403) {
            setAuthError('Token expired or invalid. Please login again.');
          } else {
            setAuthError(error?.error || 'Failed to subscribe to notifications');
          }
        }
      });

      // Listen for new notifications
      channel.bind('notification.created', (data: NotificationData) => {
        if (isMounted) {
          console.log('New notification received:', data);

          // Add to notifications list
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + (data.count || 1));

          // Show toast notification
          Toast.show({
            type: data.severity === 'critical' ? 'error' : data.severity === 'warning' ? 'info' : 'success',
            text1: data.title,
            text2: data.description,
            position: 'top',
            visibilityTime: 5000,
          });
        }
      });

      // Listen for order status updates
      channel.bind('order.notification.updated', (data: OrderStatusData) => {
        if (isMounted) {
          console.log('Order notification updated:', data);

          // Show toast for order status change
          Toast.show({
            type: 'info',
            text1: 'Order Status Updated',
            text2: `Order ${data.checkout_id}: ${data.status}`,
            position: 'top',
            visibilityTime: 5000,
          });
        }
      });

      channel.bind('notification.count.updated', (data: { unread_count: number; updated_at: string }) => {
        if (isMounted) {
          console.log('Notification count updated:', data);
          setUnreadCount(data.unread_count);
        }
      });
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      pusherService.unsubscribe(`private-customer-${userId}`);
    };
  }, [userId, token, validateToken]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, /* mark as read logic */ } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    authError,
  };
};