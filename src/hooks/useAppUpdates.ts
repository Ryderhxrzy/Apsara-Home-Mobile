import { useEffect, useRef, useCallback } from "react"
import * as Updates from "expo-updates"
import Toast from "react-native-toast-message"

interface UpdateCheckResult {
  isAvailable: boolean
  isDownloading: boolean
  downloadProgress: number
}

export const useAppUpdates = () => {
  const updateCheckPerformed = useRef(false)
  const isDownloading = useRef(false)

  const checkAndDownloadUpdate = useCallback(async () => {
    if (updateCheckPerformed.current || isDownloading.current) {
      console.log("[useAppUpdates] Update check already performed or downloading")
      return
    }

    // checkForUpdateAsync / fetchUpdateAsync are NOT supported in development
    // builds — they reject at runtime even though Updates.isEnabled may be true.
    // Skip OTA checks entirely in dev; they only run in preview/production builds.
    if (__DEV__ || !Updates.isEnabled) {
      console.log("[useAppUpdates] OTA updates not available in this environment")
      updateCheckPerformed.current = true
      return
    }

    try {
      console.log("[useAppUpdates] Checking for updates...")
      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        console.log("[useAppUpdates] Update available, downloading...")
        isDownloading.current = true

        Toast.show({
          type: "info",
          text1: "Update Available",
          text2: "Downloading new version...",
          visibilityTime: 3000,
        })

        await Updates.fetchUpdateAsync()

        console.log("[useAppUpdates] Update downloaded, reloading app...")
        Toast.show({
          type: "success",
          text1: "Update Complete",
          text2: "Restarting app...",
          visibilityTime: 2000,
        })

        await Updates.reloadAsync()
      } else {
        console.log("[useAppUpdates] App is up to date")
      }
    } catch (error) {
      console.error("[useAppUpdates] Update check error:", error)
      if (error instanceof Error) {
        console.error("[useAppUpdates] Error message:", error.message)
      }
    } finally {
      updateCheckPerformed.current = true
      isDownloading.current = false
    }
  }, [])

  useEffect(() => {
    checkAndDownloadUpdate()
  }, [checkAndDownloadUpdate])

  return { checkAndDownloadUpdate }
}
