const { Pusher } = require("pusher-js/react-native") as { Pusher: any }
import { API_CONFIG } from "../config/api"

class PusherService {
  private pusher: any = null
  private channels: Map<string, any> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isIntentionallyClosed = false

  init(token: string): Promise<void> | void {
    // If Pusher instance exists and is not disconnected, wait a bit before reinitializing
    if (this.pusher) {
      console.log("[PusherService] Disconnecting previous Pusher instance")
      this.disconnect()
      // Give time for the connection to properly close
      return new Promise((resolve) => {
        setTimeout(() => {
          this._initPusher(token)
          resolve(undefined)
        }, 500)
      })
    }

    this._initPusher(token)
  }

  private _initPusher(token: string) {
    this.isIntentionallyClosed = false
    this.reconnectAttempts = 0

    console.log("[PusherService] initializing Pusher with token:", {
      tokenExists: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + "...",
    })

    try {
      this.pusher = new Pusher(process.env.EXPO_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER || "ap3",
        authorizer: (channel: any) => ({
          authorize: (
            socketId: string,
            callback: (error: any, authData: any) => void
          ) => {
            // Conversation (support chat) channels use their own auth route;
            // everything else uses the generic realtime auth.
            const authUrl = String(channel?.name || "").startsWith(
              "private-conversation-"
            )
              ? `${API_CONFIG.BASE_URL}/conversations/pusher/auth`
              : `${API_CONFIG.BASE_URL}/realtime/pusher/auth`
            fetch(authUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  const errorText = await response.text()
                  console.error(
                    "[PusherService] auth error:",
                    response.status,
                    errorText
                  )
                  throw new Error(
                    `Auth failed with status ${response.status}: ${errorText}`
                  )
                }
                return response.json()
              })
              .then((data) => {
                console.log("[PusherService] auth success:", data)
                callback(null, data)
              })
              .catch((error) => {
                console.error("[PusherService] auth fetch error:", error)
                callback(error, null)
              })
          },
        }),
        forceTLS: true,
        enabledTransports: ["ws", "wss"],
        activityTimeout: 30000,
        pongTimeout: 30000,
      })

      if (this.pusher && this.pusher.connection) {
        this.pusher.connection.bind("state_change", (states: any) => {
          console.log(
            "[PusherService] connection state change:",
            states.previous,
            "→",
            states.current
          )

          // Handle successful connection
          if (states.current === "connected") {
            this.reconnectAttempts = 0
            console.log("[PusherService] ✅ Connected successfully")
          }

          // Handle disconnected state
          if (
            states.current === "disconnected" &&
            !this.isIntentionallyClosed
          ) {
            this._handleConnectionLoss()
          }
        })

        this.pusher.connection.bind("error", (error: any) => {
          console.error("[PusherService] connection error:", {
            code: error?.error?.code,
            message: error?.error?.message,
            type: error?.error?.type,
            fullError: error,
          })

          // Error 1006 is connection abort - needs reconnection
          if (error?.error?.code === 1006 && !this.isIntentionallyClosed) {
            console.warn(
              "[PusherService] Connection abort detected, will attempt reconnection"
            )
            this._handleConnectionLoss()
          }
        })

        this.pusher.connection.bind("failed", () => {
          console.error("[PusherService] connection failed")
          if (!this.isIntentionallyClosed) {
            this._handleConnectionLoss()
          }
        })
      }
    } catch (error) {
      console.error("[PusherService] error initializing Pusher:", error)
      throw error
    }
  }

  private _handleConnectionLoss() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(
        `[PusherService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      )

      setTimeout(() => {
        if (!this.isIntentionallyClosed && this.pusher) {
          console.log("[PusherService] Attempting to reconnect...")
          this.pusher.connect()
        }
      }, delay)
    } else {
      console.error("[PusherService] Max reconnect attempts reached")
    }
  }

  subscribe(channelName: string) {
    if (!this.pusher) {
      throw new Error("Pusher not initialized. Call init() first.")
    }

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)
    }

    const channel = this.pusher.subscribe(channelName)
    this.channels.set(channelName, channel)
    return channel
  }

  unsubscribe(channelName: string) {
    if (!this.pusher) return

    this.pusher.unsubscribe(channelName)
    this.channels.delete(channelName)
  }

  disconnect() {
    this.isIntentionallyClosed = true
    if (this.pusher) {
      try {
        // Unbind all connection events before disconnecting
        if (this.pusher.connection) {
          this.pusher.connection.unbind_all()
        }
        this.pusher.disconnect()
        console.log("[PusherService] Disconnected successfully")
      } catch (error) {
        console.error("[PusherService] error during disconnect:", error)
      } finally {
        this.pusher = null
        this.channels.clear()
      }
    }
  }

  // Called when app goes to background
  goBackground() {
    console.log("[PusherService] App going to background")
    if (
      this.pusher &&
      this.pusher.connection &&
      this.pusher.connection.state === "connected"
    ) {
      this.disconnect()
    }
  }

  // Called when app returns from background
  goForeground(token?: string) {
    console.log("[PusherService] App returning to foreground")
    if (!this.pusher && token) {
      this.init(token)
    }
  }
}

export const pusherService = new PusherService()
