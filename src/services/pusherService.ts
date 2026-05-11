const { Pusher } = require('pusher-js/react-native') as { Pusher: any };
import { API_CONFIG } from '../config/api';

class PusherService {
  private pusher: any = null;
  private channels: Map<string, any> = new Map();

  init(token: string) {
    if (this.pusher) {
      this.pusher.disconnect();
    }

    console.log('[PusherService] init with token:', {
      tokenExists: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...',
    });

    this.pusher = new Pusher(process.env.EXPO_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.PUSHER_APP_CLUSTER || 'ap3',
      authEndpoint: 'https://backend.afhome.ph/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      authTransport: 'ajax',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
    });

    if (this.pusher && this.pusher.connection) {
      this.pusher.connection.bind('state_change', (states: any) => {
        console.log('[PusherService] connection state change:', states.previous, '→', states.current);
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('[PusherService] connection error:', error);
      });
    }
  }

  subscribe(channelName: string) {
    if (!this.pusher) {
      throw new Error('Pusher not initialized. Call init() first.');
    }

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    if (!this.pusher) return;

    this.pusher.unsubscribe(channelName);
    this.channels.delete(channelName);
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channels.clear();
    }
  }
}

export const pusherService = new PusherService();