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
import { useNavigation } from '../context/NavigationContext';


// Register handlers at module level (only once)
let backgroundHandlerRegistered = false;
let foregroundHandlerRegistered = false;
let notifeeBackgroundHandlerRegistered = false;

// Store deeplinks globally - use the most recent one since we can't reliably get notification ID from notifee
let lastStoredDeeplink: string | undefined = undefined;

// Store pending deeplink from background notification for when app opens
let pendingBackgroundDeeplink: string | undefined = undefined;

// Register notifee background handler (for when app is closed/background and notification is tapped)
const registerNotifeeBackgroundHandler = () => {
  if (notifeeBackgroundHandlerRegistered) return;
  notifeeBackgroundHandlerRegistered = true;

  notifee.onBackgroundEvent(async ({ type, notification, pressAction }) => {
    console.log('[useFirebaseMessaging] Notifee background event:', { type, pressActionId: pressAction?.id });

    // Use the last stored deeplink since notifee doesn't reliably return notification ID or data
    let deeplink = lastStoredDeeplink;
    console.log('[useFirebaseMessaging] Background: Using last stored deeplink:', { deeplink, lastStoredDeeplink });

    // Handle any interaction with the notification
    if (deeplink && (type === 1 || type === 2)) {
      console.log('[useFirebaseMessaging] Notification tapped from background, storing deeplink:', deeplink);

      // Store the deeplink globally - AppNavigator will check for it when the app opens
      pendingBackgroundDeeplink = deeplink;
      console.log('[useFirebaseMessaging] Stored pending deeplink for app initialization:', { pendingBackgroundDeeplink });

      // Don't try to use Linking.openURL for internal schemes - just let the app open naturally
      // The app will check pendingBackgroundDeeplink when it initializes
    }
  });
};

const registerBackgroundMessageHandler = () => {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[useFirebaseMessaging] Background message received:', remoteMessage);
    console.log('[useFirebaseMessaging] Background data payload:', remoteMessage.data);

    try {
      const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'New notification';
      const body = remoteMessage.data?.body || remoteMessage.data?.message || remoteMessage.notification?.body || '';
      const imageUrl = remoteMessage.data?.image || remoteMessage.notification?.imageUrl || null;
      const deeplink = remoteMessage.data?.href || remoteMessage.data?.deeplink || null;

      console.log('[useFirebaseMessaging] Background parsed:', { title, body, imageUrl, deeplink });
      console.log('[useFirebaseMessaging] Background: Displaying with notifee');

      // Create Android channel for background notifications
      let androidChannelId: string | undefined;
      if (Platform.OS === 'android') {
        androidChannelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Notifications',
          importance: AndroidImportance.HIGH,
        });
      }

      // Store the deeplink globally for later retrieval (notifee doesn't reliably return notification ID or data)
      const finalDeeplink = deeplink || '/orders';
      lastStoredDeeplink = finalDeeplink;

      // Create a unique ID for this notification (for logging)
      const notificationId = `notif_${Date.now()}`;

      const notificationConfig: any = {
        id: notificationId,
        title,
        body,
        data: {
          href: finalDeeplink,
          deeplink: finalDeeplink,
          // Preserve all original data for reference
          ...remoteMessage.data,
        },
        android: {
          channelId: androidChannelId || 'default',
          smallIcon: 'ic_stat_notify',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          actions: [
            {
              title: 'View Order',
              pressAction: {
                id: 'view-order',
                launchActivity: 'default',
              },
            },
            {
              title: 'Dismiss',
              pressAction: {
                id: 'dismiss',
              },
            },
          ],
        },
      };

      console.log('[useFirebaseMessaging] Background: Storing deeplink with ID:', { notificationId, deeplink: finalDeeplink });

      // Display with image - largeIcon (small image)
      if (imageUrl) {
        try {
          console.log('[useFirebaseMessaging] Background: Attempting largeIcon with image:', imageUrl);
          await notifee.displayNotification({
            ...notificationConfig,
            android: {
              ...notificationConfig.android,
              largeIcon: imageUrl,
            },
          });
          console.log('[useFirebaseMessaging] Background notification with largeIcon displayed');
          return;
        } catch (largeIconError) {
          console.warn('[useFirebaseMessaging] Background: largeIcon failed, showing without image:', largeIconError);
        }
      }

      // Fallback: Always show notification with buttons (with or without image)
      await notifee.displayNotification(notificationConfig);
      console.log('[useFirebaseMessaging] Background notification displayed (buttons only)');
    } catch (error) {
      console.error('[useFirebaseMessaging] Background message error:', error);
    }
  });
};

// Helper to get and clear pending background deeplink
export const getPendingBackgroundDeeplink = (): string | undefined => {
  const deeplink = pendingBackgroundDeeplink;
  pendingBackgroundDeeplink = undefined; // Clear after retrieving
  console.log('[useFirebaseMessaging] Retrieved pending deeplink:', { deeplink });
  return deeplink;
};

export const useFirebaseMessaging = (token: string | null, userId: string | number | null) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const setupMessaging = async () => {
      try {
        console.log('[useFirebaseMessaging] Setting up Firebase Cloud Messaging...');

        // Register background message handler
        registerBackgroundMessageHandler();

        // Register notifee background event handler (for notification taps when app is closed)
        registerNotifeeBackgroundHandler();

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

        // Register foreground handler only once
        let unsubscribe: any;
        if (!foregroundHandlerRegistered) {
          foregroundHandlerRegistered = true;
          console.log('[useFirebaseMessaging] Registering foreground handler (first time)');

          unsubscribe = onMessage(messaging_, async (remoteMessage) => {
          console.log('[useFirebaseMessaging] Foreground notification received:', remoteMessage);
          console.log('[useFirebaseMessaging] Foreground data payload:', remoteMessage.data);

          const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'New notification';
          const body = remoteMessage.data?.body || remoteMessage.data?.message || remoteMessage.notification?.body || '';
          const imageUrl = remoteMessage.data?.image || remoteMessage.notification?.imageUrl || null;
          const deeplink = remoteMessage.data?.href || remoteMessage.data?.deeplink || null;

          console.log('[useFirebaseMessaging] Foreground parsed:', { title, body, imageUrl, deeplink });
          console.log('[useFirebaseMessaging] About to create notificationConfig...');

          try {
            // Store the deeplink globally for later retrieval (notifee doesn't reliably return notification ID or data)
            const finalDeeplink = deeplink || '/orders';
            lastStoredDeeplink = finalDeeplink;

            // Create a unique ID for this notification (for logging)
            const notificationId = `notif_${Date.now()}`;

            // Notification config with deeplink and action buttons
            const notificationConfig: any = {
              id: notificationId,
              title,
              body,
              data: {
                href: finalDeeplink,
                deeplink: finalDeeplink,
                // Preserve all original data for reference
                ...remoteMessage.data,
              },
              android: {
                channelId: androidChannelId || 'default',
                smallIcon: 'ic_stat_notify',
                pressAction: {
                  id: 'default',
                  launchActivity: 'default',
                },
                actions: [
                  {
                    title: 'View Order',
                    pressAction: {
                      id: 'view-order',
                      launchActivity: 'default',
                    },
                  },
                  {
                    title: 'Dismiss',
                    pressAction: {
                      id: 'dismiss',
                    },
                  },
                ],
              },
            };

            console.log('[useFirebaseMessaging] Foreground: Storing deeplink with ID:', { notificationId, deeplink: finalDeeplink });

            console.log('[useFirebaseMessaging] Foreground notificationConfig created, imageUrl:', imageUrl);

            // Display with image - largeIcon (small image)
            console.log('[useFirebaseMessaging] Checking imageUrl:', imageUrl ? 'YES - will attempt display' : 'NO - will show without image');
            if (imageUrl) {
              try {
                console.log('[useFirebaseMessaging] Foreground: Attempting largeIcon with image:', imageUrl);
                await notifee.displayNotification({
                  ...notificationConfig,
                  android: {
                    ...notificationConfig.android,
                    largeIcon: imageUrl,
                  },
                });
                console.log('[useFirebaseMessaging] Foreground notification with largeIcon displayed');
                return;
              } catch (largeIconError) {
                console.warn('[useFirebaseMessaging] Foreground: largeIcon failed, showing without image:', largeIconError);
              }
            }

            // Fallback: Always show notification with buttons (with or without image)
            console.log('[useFirebaseMessaging] Displaying notification with buttons');
            await notifee.displayNotification(notificationConfig);
          } catch (displayError) {
            console.error('[useFirebaseMessaging] Foreground local notification failed:', displayError);
          }
          });
        } else {
          console.log('[useFirebaseMessaging] Foreground handler already registered, skipping');
          unsubscribe = () => {}; // dummy
        }

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

        // Helper to handle purchases deeplink with navigation context
        const handlePurchasesDeeplinkWithNav = (deeplink: string) => {
          try {
            // Parse purchases:// deeplinks - Format: purchases://status/checkout_id
            const parts = deeplink.replace('purchases://', '').split('/');
            const status = parts[0];
            const checkoutId = parts[1];

            if (!checkoutId) {
              console.error('[useFirebaseMessaging] Invalid purchases deeplink format:', { deeplink, status, checkoutId });
              return;
            }

            console.log('[useFirebaseMessaging] Handling purchases deeplink:', { status, checkoutId });
            navigation.openPurchaseOrder(checkoutId, status);
          } catch (error) {
            console.error('[useFirebaseMessaging] Error handling purchases deeplink:', { deeplink, error });
          }
        };

        // Handle foreground notification press (notifee - when app is already open)
        const unsubscribeNotifeePress = notifee.onForegroundEvent(({ type, notification, pressAction }) => {
          // Use the last stored deeplink since notifee doesn't reliably return notification ID or data
          const deeplink = lastStoredDeeplink;
          console.log('[useFirebaseMessaging] Foreground notification event:', { type, pressActionId: pressAction?.id, deeplink, lastStoredDeeplink });

          // Handle any press event (type can be various values depending on notification state)
          if (type === 1 || type === 2) { // PRESS = 1 or ACTION_PRESS = 2
            const actionId = pressAction?.id;
            console.log('[useFirebaseMessaging] Notification pressed:', { type, actionId, deeplink });

            // For internal deeplinks, handle directly without going through Linking
            if (deeplink && typeof deeplink === 'string' && deeplink.trim()) {
              if (deeplink.startsWith('purchases://')) {
                handlePurchasesDeeplinkWithNav(deeplink);
              } else {
                // For external URLs, use Linking.openURL
                Linking.openURL(deeplink).catch(err => console.error('[useFirebaseMessaging] Failed to open external URL:', err));
              }
            }

            if (actionId === 'dismiss') {
              console.log('[useFirebaseMessaging] Notification dismissed by user');
            }
          } else if (type !== 3) {
            // Handle any other event types that might indicate a notification press
            console.log('[useFirebaseMessaging] Other notification event type:', { type, deeplink });
            if (deeplink && typeof deeplink === 'string' && deeplink.trim()) {
              if (deeplink.startsWith('purchases://')) {
                handlePurchasesDeeplinkWithNav(deeplink);
              } else {
                Linking.openURL(deeplink).catch(err => console.error('[useFirebaseMessaging] Failed to open external URL:', err));
              }
            }
          }
        });

        // Handle app opened from closed state via notification or button press
        let initialNotificationProcessed = false;
        const notificationOpenedApp = await getInitialNotification(messaging_);
        if (notificationOpenedApp) {
          console.log('[useFirebaseMessaging] App opened from closed state via Firebase notification');
          const deeplink = notificationOpenedApp?.data?.href || notificationOpenedApp?.data?.deeplink;
          if (deeplink && typeof deeplink === 'string' && deeplink.trim()) {
            console.log('[useFirebaseMessaging] Storing initial deeplink:', deeplink);
            // For internal deeplinks, store in pending - will be handled when app fully initializes
            // For external URLs, try to open directly
            if (deeplink.startsWith('purchases://')) {
              pendingBackgroundDeeplink = deeplink;
              console.log('[useFirebaseMessaging] Stored initial purchases deeplink as pending');
            } else {
              // Only open external URLs through Linking
              setTimeout(() => {
                Linking.openURL(deeplink).catch(err => console.error('[useFirebaseMessaging] Failed to open external URL:', err));
              }, 1000);
            }
            initialNotificationProcessed = true;
          }
        }

        // Also check notifee for initial notification (for notifications that were opened by tapping)
        if (!initialNotificationProcessed) {
          try {
            const notifeeInitialNotification = await notifee.getInitialNotification();
            if (notifeeInitialNotification?.notification?.data) {
              console.log('[useFirebaseMessaging] App opened from notification (notifee)', { hasData: !!notifeeInitialNotification.notification.data });
              const deeplink = (notifeeInitialNotification.notification.data?.href || notifeeInitialNotification.notification.data?.deeplink) as string | undefined;
              if (deeplink && typeof deeplink === 'string' && deeplink.trim()) {
                console.log('[useFirebaseMessaging] Storing initial notifee deeplink:', deeplink);
                // For internal deeplinks, store in pending - will be handled when app fully initializes
                // For external URLs, try to open directly
                if (deeplink.startsWith('purchases://')) {
                  pendingBackgroundDeeplink = deeplink;
                  console.log('[useFirebaseMessaging] Stored initial purchases deeplink as pending');
                } else {
                  // Only open external URLs through Linking
                  setTimeout(() => {
                    Linking.openURL(deeplink).catch(err => console.error('[useFirebaseMessaging] Failed to open external URL:', err));
                  }, 1000);
                }
                initialNotificationProcessed = true;
              }
            }
          } catch (e) {
            console.log('[useFirebaseMessaging] Error getting initial notifee notification:', e);
          }
        }

        // Handle background notification opened (when app is in background)
        const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging_, (remoteMessage) => {
          console.log('[useFirebaseMessaging] Notification opened from background:', remoteMessage);
          const deeplink = remoteMessage?.data?.href || remoteMessage?.data?.deeplink;
          if (deeplink) {
            console.log('[useFirebaseMessaging] Emitting deeplink from background state:', deeplink);
            Linking.openURL(deeplink).catch(err => {
              console.error('[useFirebaseMessaging] Failed to open deeplink:', err);
            });
          }
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
