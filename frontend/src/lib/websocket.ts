/**
 * WebSocket Service for Real-time Notifications
 * خدمة WebSocket للإشعارات في الوقت الفعلي
 */

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;
      this.shouldReconnect = true;

      const url = token ? `${this.config.url}?token=${token}` : this.config.url;

      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onConnectHandlers.forEach(handler => handler());
          resolve();
        };

        this.socket.onclose = () => {
          this.isConnecting = false;
          this.onDisconnectHandlers.forEach(handler => handler());
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          this.isConnecting = false;
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.push(handler);
    return () => {
      const index = this.onConnectHandlers.indexOf(handler);
      if (index > -1) {
        this.onConnectHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to disconnection events
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.push(handler);
    return () => {
      const index = this.onDisconnectHandlers.indexOf(handler);
      if (index > -1) {
        this.onDisconnectHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: { type: string; payload: any }): void {
    const { type, payload } = data;
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }

    // Also trigger 'all' handlers
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(data));
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }
}

// Create singleton instance
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6001';
export const wsService = new WebSocketService({ url: wsUrl });

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  read: boolean;
}

// Hook for using WebSocket in React components
import { useEffect, useState, useCallback } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubConnect = wsService.onConnect(() => setIsConnected(true));
    const unsubDisconnect = wsService.onDisconnect(() => setIsConnected(false));

    // Subscribe to notifications
    const unsubNotification = wsService.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Connect if not already connected
    if (!wsService.isConnected()) {
      const token = localStorage.getItem('token');
      wsService.connect(token || undefined).catch(console.error);
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubNotification();
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    wsService.send('mark_read', { id });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    wsService.send('clear_all', {});
  }, []);

  return {
    isConnected,
    notifications,
    markAsRead,
    clearAll,
    send: wsService.send.bind(wsService),
    on: wsService.on.bind(wsService),
  };
}

export default wsService;
