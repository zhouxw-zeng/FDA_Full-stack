import { http } from './request';

import type { AiChatRequest, AiChatResponse } from '@/types';

export function sendChatMessage(payload: AiChatRequest): Promise<AiChatResponse> {
  return http.post<AiChatResponse>('/ai/chat', payload);
}
