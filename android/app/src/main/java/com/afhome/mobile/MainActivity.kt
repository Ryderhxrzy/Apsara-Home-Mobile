package com.afhome.mobile

import android.os.Build
import android.os.Bundle
import android.content.Intent
import android.net.Uri
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  companion object {
    private const val TAG = "MainActivity"
  }

  private var lastProcessedDeeplink: String? = null
  private var isInitialLaunch = true

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);

    // Handle deeplink from notification BEFORE React initializes
    // This ensures React's Linking.getInitialURL() picks up the deeplink
    if (isInitialLaunch) {
      handleNotificationIntent(intent)
      isInitialLaunch = false
    }

    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Handle deeplink when app is already running and user taps notification
    handleNotificationIntent(intent)
  }

  private fun handleNotificationIntent(intent: Intent?) {
    Log.d(TAG, "handleNotificationIntent called")
    Log.d(TAG, "Intent action: ${intent?.action}")
    Log.d(TAG, "Intent data: ${intent?.data}")

    if (intent?.data != null) {
      val deeplink = intent.data.toString()
      Log.d(TAG, "Notification deeplink received: $deeplink")
      Log.d(TAG, "URI scheme: ${intent.data?.scheme}, host: ${intent.data?.host}, path: ${intent.data?.path}")

      // Only set intent if this is a NEW deeplink (not already processed)
      if (deeplink != lastProcessedDeeplink) {
        lastProcessedDeeplink = deeplink
        setIntent(intent)
        Log.d(TAG, "Intent updated in MainActivity with new deeplink")

        // Schedule clearing the intent after a delay to let React Navigation process it
        // This prevents the same deeplink from being triggered on app reopens
        window.decorView.postDelayed({
          val newIntent = Intent(this, MainActivity::class.java).apply {
            action = Intent.ACTION_MAIN
            addCategory(Intent.CATEGORY_LAUNCHER)
            // Explicitly set data to null to clear any deeplink
            data = null
          }
          setIntent(newIntent)
          Log.d(TAG, "Intent cleared after React Navigation processing")
        }, 1500)
      } else {
        Log.d(TAG, "Ignoring duplicate deeplink: $deeplink")
      }
    } else {
      Log.d(TAG, "No deeplink found in intent data")
    }
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
