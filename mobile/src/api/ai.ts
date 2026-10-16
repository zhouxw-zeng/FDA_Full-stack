import { getAccessToken } from '@/utils/storage';

import type {
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
  AiChatSession,
  ApiResponse,
  PageResult,
} from '@/types';

import { API_BASE_URL, http } from './request';

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

export function deleteAiChatMessage(messageId: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/ai/chat/messages/${messageId}`);
}

export function deleteAiChatSession(sessionId: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/ai/chat/sessions/${sessionId}`);
}

export function clearAiChatMessages(
  sessionId: string,
): Promise<{ success: boolean; sessionId: string; deletedCount: number }> {
  return http.delete<{ success: boolean; sessionId: string; deletedCount: number }>(
    `/ai/chat/sessions/${sessionId}/messages`,
  );
}

export function clearAiChatSessions(): Promise<{
  success: boolean;
  deletedSessions: number;
  deletedMessages: number;
}> {
  return http.delete<{
    success: boolean;
    deletedSessions: number;
    deletedMessages: number;
  }>('/ai/chat/sessions');
}

export interface AiOneShotResult {
  text: string;
  providerCode?: string;
  modelName?: string;
}

/** 服务端 FilesInterceptor('files', 5) 限制，单次最多 5 个附件 */
export const AI_ONE_SHOT_MAX_FILES = 5;

/** 调用 /ai/chat/one-shot，用图片 + 提示词生成一段文案 */
export function generateAiCopy(
  filePaths: string[],
  prompt?: string,
): Promise<AiOneShotResult> {
  const token = getAccessToken();

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/ai/chat/one-shot`,
      files: filePaths.slice(0, AI_ONE_SHOT_MAX_FILES).map((uri) => ({ name: 'files', uri })),
      header: token ? { Authorization: `Bearer ${token}` } : {},
      formData: prompt ? { prompt } : {},
      success: (response) => {
        let body: ApiResponse<AiOneShotResult> | undefined;

        try {
          body = JSON.parse(response.data) as ApiResponse<AiOneShotResult>;
        } catch {
          reject(new Error('AI 生成响应解析失败'));
          return;
        }

        if (response.statusCode >= 200 && response.statusCode < 300 && body.code === 0) {
          resolve(body.data);
          return;
        }

        reject(new Error(body.message || `AI 生成失败（${response.statusCode}）`));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || 'AI 生成失败，请稍后重试'));
      },
    });
  });
}
