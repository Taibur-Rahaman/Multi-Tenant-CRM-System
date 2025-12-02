import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { useAuthStore } from '../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/api/ws';

export interface WebSocketMessage {
  eventType: string;
  tenantId?: string;
  data: any;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(tenantId: string, accessToken: string) {
    if (this.client?.connected) {
      return;
    }

    const socket = new SockJS(WS_URL);
    
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribeToTenant(tenantId);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        this.handleReconnect(tenantId, accessToken);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.handleReconnect(tenantId, accessToken);
      },
    });

    this.client.activate();
  }

  private handleReconnect(tenantId: string, accessToken: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(tenantId, accessToken);
      }, 5000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private subscribeToTenant(tenantId: string) {
    if (!this.client?.connected) {
      return;
    }

    // Subscribe to tenant-specific updates
    this.client.subscribe(`/topic/tenant/${tenantId}`, (message: IMessage) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.body);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Subscribe to user-specific notifications
    const user = useAuthStore.getState().user;
    if (user?.email) {
      this.client.subscribe(`/user/${user.email}/queue/notifications`, (message: IMessage) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.body);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Call all handlers for this event type
    const eventType = message.eventType;
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }

    // Also call wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in wildcard handler:', error);
        }
      });
    }
  }

  subscribe(eventType: string, handler: MessageHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  unsubscribe(eventType: string, handler: MessageHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.handlers.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// React hook for using WebSocket
export function useWebSocket(tenantId: string | undefined) {
  const { accessToken } = useAuthStore();
  const handlersRef = useRef<Map<string, MessageHandler>>(new Map());

  useEffect(() => {
    if (!tenantId || !accessToken) {
      return;
    }

    websocketService.connect(tenantId, accessToken);

    return () => {
      // Unsubscribe all handlers
      handlersRef.current.forEach((handler, eventType) => {
        websocketService.unsubscribe(eventType, handler);
      });
      handlersRef.current.clear();
    };
  }, [tenantId, accessToken]);

  const subscribe = useCallback((eventType: string, handler: MessageHandler) => {
    if (!tenantId) return () => {};

    handlersRef.current.set(eventType, handler);
    const unsubscribe = websocketService.subscribe(eventType, handler);
    
    return () => {
      handlersRef.current.delete(eventType);
      unsubscribe();
    };
  }, [tenantId]);

  return {
    subscribe,
    isConnected: websocketService.isConnected(),
  };
}


