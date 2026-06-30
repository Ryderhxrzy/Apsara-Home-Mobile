import {
  getToken,
  hasPermission,
  requestPermission,
  AuthorizationStatus,
} from "@react-native-firebase/messaging"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Linking, Platform } from "react-native"
import * as Application from "expo-application"
import { getFirebaseMessagingAsync } from "./firebaseMessaging"

const FCM_TOKEN_KEY = "fcm_token"

export type NotificationPermission = "authorized" | "denied" | "undetermined"

/** Current OS-level push permission for this device (does NOT prompt the user). */
export const getNotificationPermission =
  async (): Promise<NotificationPermission> => {
    try {
      const messaging = await getFirebaseMessagingAsync()
      if (!messaging) return "denied"

      const status = await hasPermission(messaging)
      if (
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL
      ) {
        return "authorized"
      }
      if (status === AuthorizationStatus.NOT_DETERMINED) {
        return "undetermined"
      }
      return "denied"
    } catch (error: any) {
      console.warn(
        "[FCMUtils] Failed to read notification permission:",
        error?.message
      )
      return "denied"
    }
  }

/** Prompt the OS permission dialog. Returns true if push is now allowed. */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const messaging = await getFirebaseMessagingAsync()
    if (!messaging) return false

    const status = await requestPermission(messaging)
    return (
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL
    )
  } catch (error: any) {
    console.warn(
      "[FCMUtils] Failed to request notification permission:",
      error?.message
    )
    return false
  }
}

/**
 * Open this app's notification settings so a user who has notifications turned
 * off can re-enable them. On Android we deep-link straight to the app's
 * notification screen; on iOS to the app's settings page. Falls back to the
 * generic app-settings screen if the deep link is unavailable.
 */
export const openAppNotificationSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:")
      return
    }

    const pkg = Application.applicationId ?? "com.afhome.mobile"
    await Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [
      { key: "android.provider.extra.APP_PACKAGE", value: pkg },
    ])
  } catch (error: any) {
    console.warn(
      "[FCMUtils] Failed to open notification settings:",
      error?.message
    )
    try {
      await Linking.openSettings()
    } catch {
      // Nothing else we can do — leave the user where they are.
    }
  }
}

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessagingAsync()
    if (!messaging) {
      return null
    }

    const currentToken = await getToken(messaging)

    if (!currentToken) {
      console.warn("[FCMUtils] No FCM token available")
      return null
    }

    // Check if we have a stored token
    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY)

    // If tokens match, no need to send to backend (device hasn't changed)
    if (storedToken === currentToken) {
      console.log("[FCMUtils] FCM token unchanged, no need to update backend")
      return null
    }

    // Token is new or different (device is new or token was reset)
    console.log(
      "[FCMUtils] New or updated FCM token:",
      currentToken.substring(0, 20) + "..."
    )

    // Store the new token for future comparisons
    await AsyncStorage.setItem(FCM_TOKEN_KEY, currentToken)

    return currentToken
  } catch (error: any) {
    // FCM might not be available in all cases (e.g., no Google Play Services on Android)
    console.error("[FCMUtils] Failed to get FCM token:", error.message)
    return null
  }
}
