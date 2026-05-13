import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import axios from 'axios';
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

        // Get or create a device ID
        let deviceId = await SecureStore.getItemAsync('device_id');
        if (!deviceId) {
          // Generate a simple device ID: timestamp + random string
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 15);
          deviceId = `device_${timestamp}_${random}`;
          await SecureStore.setItemAsync('device_id', deviceId);
          console.log('[useDeviceRegistration] Created new device ID:', deviceId);
        }

        // Register with OneSignal backend
        console.log('[useDeviceRegistration] Registering with OneSignal backend...');
        const platform = Platform.OS === 'android' ? 'android' : 'ios';

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/notifications/onesignal/register-token`,
          {
            player_id: deviceId,
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
