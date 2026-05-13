import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
const OneSignal = require('react-native-onesignal').default;
import { API_CONFIG } from '../config/api';
import axios from 'axios';

export const useOneSignalTokenRegistration = (token: string | null, userId: string | number | null) => {
  const [registrationAttempted, setRegistrationAttempted] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const registerOneSignalToken = async () => {
      try {
        // Wait a bit for OneSignal native module to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // Set the customer ID for targeting
        OneSignal.User.addAlias('customer_id', userId.toString());
        console.log('[useOneSignalTokenRegistration] Set customer ID:', userId);

        // Get the OneSignal push subscription ID (player ID)
        const subscription = OneSignal.User.pushSubscription;
        const playerId = await subscription.getIdAsync();

        console.log('[useOneSignalTokenRegistration] Got OneSignal player ID:', playerId);

        if (!playerId) {
          console.warn('[useOneSignalTokenRegistration] No player ID returned from OneSignal');
          return;
        }

        // Get device information
        const deviceName = `${Platform.OS}`;
        const platform = Platform.OS === 'android' ? 'android' : 'ios';

        // Register the token with the backend
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/onesignal/register-token`,
          {
            player_id: playerId,
            device_name: deviceName,
            platform: platform,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          console.log('[useOneSignalTokenRegistration] ✅ OneSignal token registered successfully');
          setRegistrationAttempted(true);
        }
      } catch (error) {
        console.error('[useOneSignalTokenRegistration] Failed to register OneSignal token:', error);
        // Retry after a delay if OneSignal wasn't ready
        setTimeout(() => {
          registerOneSignalToken();
        }, 2000);
      }
    };

    registerOneSignalToken();
  }, [token, userId]);

  return { registrationAttempted };
};
