import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '@/utils/storage';
import type { AiChatMessage, AiChatRequest } from '@/types';

interface ChatStartPayload {
  sessionId: string | null;
}

interface ChatDeltaPayload {
  sessionId: string;
  content: string;
}

interface ChatReplyPayload {
  sessionId: string;
  message: AiChatMessage;
}

interface ChatDonePayload {
  sessionId: string;
}

interface ChatErrorPayload {
  code: string;
  message: string;
}

interface AiChatStreamCallbacks {
  onStart?: (payload: ChatStartPayload) => void;
  onDelta?: (payload: ChatDeltaPayload) => void;
  onReply?: (payload: ChatReplyPayload) => void;
  onDone?: (payload: ChatDonePayload) => void;
}

const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/+$/, '');

function createRequestId(): string {
  return `mobile-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveWsUrl(): string {
  if (!WS_BASE_URL) {
    throw new Error('未配置 VITE_WS_BASE_URL');
  }
  return `${WS_BASE_URL}/ai/chat`;
}

export function streamAiChat(
  payload: AiChatRequest,
  callbacks: AiChatStreamCallbacks,
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('请先登录'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const socket: Socket = io(resolveWsUrl(), {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
    });

    const cleanup = (): void => {
      socket.removeAllListeners();
      socket.disconnect();
    };

    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve();
    };

    const fail = (error: unknown): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error('AI 流式连接失败'));
    };

    socket.on('connect', () => {
      socket.emit('chat:send', {
        ...payload,
        requestId: createRequestId(),
      });
    });

    socket.on('chat:start', (data: ChatStartPayload) => {
      callbacks.onStart?.(data);
    });

    socket.on('chat:delta', (data: ChatDeltaPayload) => {
      callbacks.onDelta?.(data);
    });

    socket.on('chat:reply', (data: ChatReplyPayload) => {
      callbacks.onReply?.(data);
    });

    socket.on('chat:done', (data: ChatDonePayload) => {
      callbacks.onDone?.(data);
      finish();
    });

    socket.on('chat:error', (data: ChatErrorPayload) => {
      fail(new Error(data.message || 'AI 问答失败'));
    });

    socket.on('connect_error', (error: Error) => {
      fail(error);
    });

    socket.connect();
  });
}
