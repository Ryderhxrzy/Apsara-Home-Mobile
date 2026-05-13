import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// Handle background notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background Handler] Notification received in background:', {
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
  });
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
