import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { pusherService } from '../services/pusherService';
import Toast from 'react-native-toast-message';
import { useTokenRefresh } from './useTokenRefresh';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  description: string;
  message?: string;
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
  order_id?: number;
  checkout_id: string;
  event_type?: string;
  title?: string;
  description?: string;
  message?: string;
  status: string;
  payment_status?: string;
  tracking_number?: string;
  created_at?: string;
}

export const useNotifications = (userId: string | number, token: string, onNavigateToPurchases?: (status: string, orderId?: string) => void, onNotificationUpdate?: () => void) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastOrderNotification, setLastOrderNotification] = useState<OrderStatusData | null>(null);
  const { validateToken } = useTokenRefresh();
  const appStateRef = useRef<AppStateStatus>('active');
  const channelNameRef = useRef<string>('');

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove?.();
    };
  }, [token]);

  const handleAppStateChange = useCallback((state: AppStateStatus) => {
    console.log('[useNotifications] app state changed:', appStateRef.current, '→', state);
    appStateRef.current = state;

    if (state === 'background') {
      pusherService.goBackground();
    } else if (state === 'active' && token && channelNameRef.current) {
      // Reinitialize when app comes back to foreground
      console.log('[useNotifications] reinitializing Pusher after returning from background');
      pusherService.goForeground(token);
      // Resubscribe to channel
      setTimeout(() => {
        const channel = pusherService.subscribe(channelNameRef.current);
        setupChannelListeners(channel);
      }, 500);
    }
  }, [token]);

  const setupChannelListeners = (channel: any) => {
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[useNotifications] ✅ pusher subscription succeeded for:', channelNameRef.current);
      setAuthError(null);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[useNotifications] ❌ pusher subscription error:', {
        channel: channelNameRef.current,
        status: error?.status,
        error: error?.error,
        type: error?.type,
      });

      if (error?.status === 403) {
        setAuthError('Token expired or invalid. Please login again.');
      } else {
        setAuthError(error?.error || 'Failed to subscribe to notifications');
      }
    });

    // Listen for new notifications
    channel.bind('notification.created', (data: NotificationData) => {
      console.log('New notification received:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + (data.count || 1));

      Toast.show({
        type: data.severity === 'critical' ? 'error' : data.severity === 'warning' ? 'info' : 'success',
        text1: data.title,
        text2: data.description || data.message,
        position: 'top',
        visibilityTime: 5000,
        onPress: () => {
          if (onNavigateToPurchases && data.href) {
            const deepLinkRegex = /^purchases:\/\/([^\/]+)(?:\/(.+))?$/;
            const match = data.href.match(deepLinkRegex);
            if (match && match[1]) {
              const status = match[1];
              const orderId = match[2] || (data.order_id?.toString());
              onNavigateToPurchases(status, orderId);
            }
          }
        },
      });
    });

    // Listen for order status updates
    channel.bind('order.notification.updated', (data: OrderStatusData) => {
      console.log('Order notification updated:', data);

      const hasChanged = !lastOrderNotification ||
        lastOrderNotification.checkout_id !== data.checkout_id ||
        lastOrderNotification.status !== data.status ||
        lastOrderNotification.message !== data.message;

      if (hasChanged) {
        setLastOrderNotification(data);
        onNotificationUpdate?.();

        Toast.show({
          type: 'info',
          text1: data.title || 'Order Status Updated',
          text2: data.message || `Order ${data.checkout_id}: ${data.status}`,
          position: 'top',
          visibilityTime: 5000,
          onPress: () => {
            if (onNavigateToPurchases) {
              onNavigateToPurchases(data.status, data.checkout_id);
            }
          },
        });
      } else {
        console.log('[useNotifications] Ignoring duplicate notification:', data);
      }
    });

    channel.bind('notification.count.updated', (data: { unread_count: number; updated_at: string }) => {
      setUnreadCount(data.unread_count);
    });
  };

  useEffect(() => {
    if (!userId || !token) {
      console.log('[useNotifications] missing userId or token, skipping realtime setup', { userId, token: !!token });
      return;
    }

    let isMounted = true;

    const initializeNotifications = async () => {
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
      channelNameRef.current = channelName;

      console.log('[useNotifications] initializing realtime notifications', {
        channelName,
        tokenLength: token?.length,
        userId,
      });

      try {
        // Initialize Pusher - may be async if waiting for previous disconnect
        await pusherService.init(token);

        if (!isMounted) return;

        // Subscribe to customer's private channel
        const channel = pusherService.subscribe(channelName);
        console.log('[useNotifications] subscribed to channel', channelName);

        setupChannelListeners(channel);
      } catch (error) {
        console.error('[useNotifications] error initializing notifications:', error);
        if (isMounted) {
          setAuthError('Failed to initialize notifications. Please try again.');
        }
      }
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