import { Platform } from 'react-native';
import { getApps, initializeApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';

type FirebaseMessaging = ReturnType<typeof getMessaging>;

const firebaseOptions = {
  apiKey: 'AIzaSyB47Hojmph1vQ4xv0FJ9CSKMHo7gmDZ35Q',
  appId: '1:49224817766:android:e49d6ba4a387508591e1a7',
  messagingSenderId: '49224817766',
  projectId: 'af-home-notif',
  storageBucket: 'af-home-notif.firebasestorage.app',
};

export const ensureFirebaseApp = async () => {
  if (Platform.OS === 'web') {
    return null;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  return initializeApp(firebaseOptions);
};

export const getFirebaseMessagingAsync = async (): Promise<FirebaseMessaging | null> => {
  try {
    const app = await ensureFirebaseApp();
    return app ? getMessaging(app) : null;
  } catch (error) {
    console.warn('[FirebaseMessaging] Messaging is unavailable:', error);
    return null;
  }
};
