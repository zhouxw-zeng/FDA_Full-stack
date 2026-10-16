import { http } from './request';

import type {
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
  AiChatSession,
  PageResult,
} from '@/types';

export function sendChatMessage(payload: AiChatRequest): Promise<AiChatResponse> {
  return http.post<AiChatResponse>('/ai/chat', payload);
}

export function fetchAiChatSessions(page = 1, size = 20): Promise<PageResult<AiChatSession>> {
  return http.get<PageResult<AiChatSession>>('/ai/chat/sessions', {
    page,
    size,
  });
}

export function fetchAiChatMessages(sessionId: string): Promise<AiChatMessage[]> {
  return http.get<AiChatMessage[]>(`/ai/chat/sessions/${sessionId}/messages`);
}
