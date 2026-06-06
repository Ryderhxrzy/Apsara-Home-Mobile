import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { getToken, onTokenRefresh } from '@react-native-firebase/messaging';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { getFirebaseMessagingAsync } from '../utils/firebaseMessaging';

// Notification display is now handled by Kotlin (MyFirebaseMessagingService)
// This hook only handles token registration and deeplink navigation

export const useFirebaseMessaging = (
  token: string | null,
  userId: string | number | null,
  onNotificationPressed?: (checkoutId: string, status: string) => void
) => {

  // Separate effect for token registration (depends on auth)
  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    let unsubscribeTokenRefresh: (() => void) | undefined;
    let cancelled = false;

    const setupTokenRegistration = async () => {
      try {
        console.log('[useFirebaseMessaging] Setting up token registration...');

        const messaging_ = await getFirebaseMessagingAsync();
        if (!messaging_) {
          return;
        }

        let permissionEnabled = true;
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const permissionResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          permissionEnabled = permissionResult === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!permissionEnabled) {
          console.warn('[useFirebaseMessaging] Notification permission not granted on Android');
          return;
        }

        const registerFcmToken = async (fcmToken: string) => {
          const platform = Platform.OS === 'android' ? 'android' : 'ios';
          await axios.post(
            `${API_CONFIG.BASE_URL}/notifications/fcm/register-token`,
            {
              fcm_token: fcmToken,
              device_name: `${platform}-device`,
              platform,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('[useFirebaseMessaging] FCM token registered');
        };

        const fcmToken = await getToken(messaging_);
        if (!fcmToken) {
          console.warn('[useFirebaseMessaging] Failed to get FCM token');
          return;
        }

        await registerFcmToken(fcmToken);

        if (cancelled) {
          return;
        }

        unsubscribeTokenRefresh = onTokenRefresh(messaging_, async (newToken) => {
          try {
            console.log('[useFirebaseMessaging] FCM token refreshed');
            await registerFcmToken(newToken);
          } catch (error) {
            console.error('[useFirebaseMessaging] Failed to register refreshed token:', error);
          }
        });
      } catch (error) {
        console.error('[useFirebaseMessaging] Error setting up token registration:', error);
      }
    };

    setupTokenRegistration();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
    };
  }, [token, userId]);

  return null;
};
