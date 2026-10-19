import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '@/utils/storage';
import type { ForumNotification } from '@/types';

export interface NotificationNewPayload {
  notification: ForumNotification;
  unreadCount: number;
}

interface NotificationSocketCallbacks {
  onConnected?: (payload: { customerId: string }) => void;
  onNew?: (payload: NotificationNewPayload) => void;
  onError?: (error: Error) => void;
}

export interface NotificationSocketHandle {
  close: () => void;
}

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/+$/, '');

export function connectNotificationSocket(
  callbacks: NotificationSocketCallbacks,
): NotificationSocketHandle {
  const token = getAccessToken();
  if (!token) {
    callbacks.onError?.(new Error('请先登录'));
    return { close: () => undefined };
  }

  if (!WS_BASE_URL) {
    callbacks.onError?.(new Error('未配置 VITE_WS_BASE_URL'));
    return { close: () => undefined };
  }

  const socket: Socket = io(`${WS_BASE_URL}/forum/notifications`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('notification:connected', (payload: { customerId: string }) => {
    callbacks.onConnected?.(payload);
  });

  socket.on('notification:new', (payload: NotificationNewPayload) => {
    callbacks.onNew?.(payload);
  });

  socket.on('notification:error', (payload: { code: string; message: string }) => {
    callbacks.onError?.(new Error(payload.message || '消息连接异常'));
  });

  socket.on('connect_error', (error: Error) => {
    callbacks.onError?.(error);
  });

  return {
    close: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
