import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import axios from 'axios';
import OneSignal from 'react-native-onesignal';
import { API_CONFIG } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export const useDeviceRegistration = (token: string | null, userId: string | number | null) => {
  const [registrationAttempted, setRegistrationAttempted] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const registerDevice = async () => {
      try {
        console.log('[useDeviceRegistration] Starting device registration...');

        // Get the actual OneSignal player ID
        let playerId: string | null = null;
        try {
          playerId = await OneSignal.User.pushSubscription.getIdAsync();
          console.log('[useDeviceRegistration] Got OneSignal player ID:', playerId);
        } catch (error) {
          console.error('[useDeviceRegistration] Failed to get OneSignal player ID:', error);
          return;
        }

        if (!playerId) {
          console.warn('[useDeviceRegistration] OneSignal player ID is empty');
          return;
        }

        // Register with OneSignal backend
        console.log('[useDeviceRegistration] Registering with OneSignal backend...');
        const platform = Platform.OS === 'android' ? 'android' : 'ios';

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/onesignal/register-token`,
          {
            player_id: playerId,
            device_name: `${platform}-device`,
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
          console.log('[useDeviceRegistration] ✅ Device registered successfully');
          setRegistrationAttempted(true);
        }
      } catch (error) {
        console.error('[useDeviceRegistration] Failed to register device:', error);
      }
    };

    registerDevice();
  }, [token, userId]);

  return { registrationAttempted };
};
