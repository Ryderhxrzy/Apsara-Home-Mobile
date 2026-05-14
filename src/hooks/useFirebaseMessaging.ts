import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import {
  getMessaging,
  onMessage,
  getToken,
  getInitialNotification,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export const useFirebaseMessaging = (token: string | null, userId: string | number | null) => {
  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const setupMessaging = async () => {
      try {
        console.log('[useFirebaseMessaging] Setting up Firebase Cloud Messaging...');

        const messaging_ = getMessaging();
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

        let androidChannelId: string | undefined;
        if (Platform.OS === 'android') {
          androidChannelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Notifications',
            importance: AndroidImportance.HIGH,
          });
        }

        const registerFcmToken = async (fcmToken: string) => {
          const platform = Platform.OS === 'android' ? 'android' : 'ios';
          const response = await axios.post(
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

          if (response.status === 200 || response.status === 201) {
            console.log('[useFirebaseMessaging] FCM token registered successfully');
          }
        };

        const fcmToken = await getToken(messaging_);
        console.log('[useFirebaseMessaging] FCM Token:', fcmToken);

        if (!fcmToken) {
          console.warn('[useFirebaseMessaging] Failed to get FCM token');
          return;
        }

        await registerFcmToken(fcmToken);

        const unsubscribeTokenRefresh = onTokenRefresh(messaging_, async (newToken) => {
          try {
            console.log('[useFirebaseMessaging] FCM token refreshed:', newToken);
            await registerFcmToken(newToken);
          } catch (refreshError) {
            console.error('[useFirebaseMessaging] Failed to register refreshed token:', refreshError);
          }
        });

        const unsubscribe = onMessage(messaging_, async (remoteMessage) => {
          console.log('[useFirebaseMessaging] Foreground notification received:', remoteMessage);

          const title = remoteMessage.notification?.title || 'New notification';
          const body = remoteMessage.notification?.body || '';
          const imageUrl = remoteMessage.notification?.imageUrl || remoteMessage.data?.image;
          const deeplink = remoteMessage.data?.href || remoteMessage.data?.deeplink || null;

          console.log('[useFirebaseMessaging] Extracted image URL:', imageUrl);
          console.log('[useFirebaseMessaging] Extracted deeplink:', deeplink);

          try {
            // Notification config with deeplink
            const notificationConfig: any = {
              title,
              body,
              data: {
                href: deeplink || '/orders',
              },
              android: {
                channelId: androidChannelId || 'default',
                smallIcon: 'ic_stat_notify',
                pressAction: {
                  id: 'default',
                },
              },
            };

            // Try displaying with large image first (bigPicture)
            if (imageUrl) {
              try {
                console.log('[useFirebaseMessaging] Attempting to display with bigPicture:', imageUrl);
                await notifee.displayNotification({
                  ...notificationConfig,
                  android: {
                    ...notificationConfig.android,
                    bigPicture: {
                      image: imageUrl,
                    },
                  },
                });
                console.log('[useFirebaseMessaging] Successfully displayed with bigPicture');
                return;
              } catch (imageError) {
                console.warn('[useFirebaseMessaging] Failed to display with bigPicture, trying largeIcon:', imageError);

                // Fallback to largeIcon if bigPicture fails
                try {
                  await notifee.displayNotification({
                    ...notificationConfig,
                    android: {
                      ...notificationConfig.android,
                      largeIcon: imageUrl,
                    },
                  });
                  console.log('[useFirebaseMessaging] Successfully displayed with largeIcon');
                  return;
                } catch (largeIconError) {
                  console.warn('[useFirebaseMessaging] Failed with largeIcon too, falling back to text:', largeIconError);
                }
              }
            }

            // Fallback: Display without image (pure text)
            console.log('[useFirebaseMessaging] Displaying text-only notification');
            await notifee.displayNotification(notificationConfig);
          } catch (displayError) {
            console.error('[useFirebaseMessaging] Foreground local notification failed:', displayError);
          }
        });

        // Handle notification press (when user clicks the notification and app opens from background)
        const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] App opened from notification:', remoteMessage);
          const deeplink = remoteMessage?.data?.href || remoteMessage?.data?.deeplink;
          if (deeplink) {
            console.log('[useFirebaseMessaging] Emitting deeplink event:', deeplink);
            Linking.openURL(deeplink).catch(err => {
              console.error('[useFirebaseMessaging] Failed to open deeplink:', err);
            });
          }
        });

        // Handle foreground notification press (notifee - when app is already open)
        const unsubscribeNotifeePress = notifee.onForegroundEvent(({ type, notification }) => {
          console.log('[useFirebaseMessaging] Foreground notification event:', type, notification);
          if (type === 1) { // PressAction = 1
            const deeplink = notification?.data?.href as string | undefined;
            if (deeplink) {
              console.log('[useFirebaseMessaging] User pressed foreground notification, emitting deeplink:', deeplink);
              Linking.openURL(deeplink).catch(err => {
                console.error('[useFirebaseMessaging] Failed to open deeplink:', err);
              });
            }
          }
        });

        const notificationOpenedApp = await getInitialNotification(messaging_);
        if (notificationOpenedApp) {
          console.log('[useFirebaseMessaging] App opened from closed state via notification');
        }

        const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] Notification opened:', remoteMessage);
        });

        return () => {
          unsubscribe();
          unsubscribeNotificationOpened();
          unsubscribeTokenRefresh();
          if (unsubscribeOnNotificationOpenedApp) {
            unsubscribeOnNotificationOpenedApp();
          }
          if (unsubscribeNotifeePress) {
            unsubscribeNotifeePress();
          }
        };
      } catch (error) {
        console.error('[useFirebaseMessaging] Error:', error);
      }
    };

    setupMessaging();
  }, [token, userId]);

  return null;
};
