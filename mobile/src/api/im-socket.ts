import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '@/utils/storage';
import type { SocialMessage } from '@/types';

export interface ImSocketHandle {
  close: () => void;
}

interface ImSocketCallbacks {
  onMessage?: (message: SocialMessage) => void;
  onConnected?: (payload: { customerId: string }) => void;
  onError?: (error: Error) => void;
}

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/+$/, '');

export function connectImSocket(callbacks: ImSocketCallbacks): ImSocketHandle {
  const token = getAccessToken();
  if (!token) {
    callbacks.onError?.(new Error('请先登录'));
    return { close: () => undefined };
  }

  if (!WS_BASE_URL) {
    callbacks.onError?.(new Error('未配置 VITE_WS_BASE_URL'));
    return { close: () => undefined };
  }

  const socket: Socket = io(`${WS_BASE_URL}/customer-im`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('im:connected', (payload: { customerId: string }) => {
    callbacks.onConnected?.(payload);
  });

  socket.on('im:new', (message: SocialMessage) => {
    callbacks.onMessage?.(message);
  });

  socket.on('im:error', (payload: { code: string; message: string }) => {
    callbacks.onError?.(new Error(payload.message || '聊天连接异常'));
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
