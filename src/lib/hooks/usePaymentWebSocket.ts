'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import io, { Socket } from 'socket.io-client';
import { PaymentUpdateEvent } from '@/lib/types/payment';

interface UsePaymentWebSocketOptions {
  userId?: string | null;
  onPaymentUpdate?: (event: PaymentUpdateEvent) => void;
  onError?: (error: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function usePaymentWebSocket(options: UsePaymentWebSocketOptions = {}) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PaymentUpdateEvent | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Get WebSocket URL from environment
  const getSocketUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl) {
        return backendUrl;
      }
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return `${protocol}//${host}:8000`;
      } else {
        return `${protocol}//${host}`;
      }
    }
    return 'http://localhost:8000';
  }, []);

  // Get user ID from Supabase auth or options
  const userId = options.userId ?? user?.id ?? null;

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    if (!userId) {
      return;
    }

    const socketUrl = getSocketUrl();

    socketRef.current = io(`${socketUrl}/payment`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      forceNew: false,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);

      if (userId) {
        socketRef.current?.emit('subscribe', { userId });
      }

      optionsRef.current.onConnect?.();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    });

    socketRef.current.on('connect_error', (error) => {
      setIsConnected(false);
      optionsRef.current.onError?.(error);
    });

    socketRef.current.on('payment_update', (event: PaymentUpdateEvent) => {
      setLastUpdate(event);
      optionsRef.current.onPaymentUpdate?.(event);
    });

    socketRef.current.on('subscribed', () => {
      // Subscription successful
    });

    socketRef.current.on('unsubscribed', () => {
      // Unsubscription successful
    });

    socketRef.current.on('error', (error) => {
      optionsRef.current.onError?.(error);
    });
  }, [userId, getSocketUrl]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (userId) {
        socketRef.current.emit('unsubscribe', { userId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [userId]);

  // Connect on mount and when userId changes
  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    if (!userId) {
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect, options.enabled]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    lastUpdate,
    connect,
    disconnect,
    reconnect,
  };
}
