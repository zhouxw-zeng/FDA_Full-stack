import { http } from './request';

import type {
  AiModelConfig,
  AiModelPayload,
  AiModelQuery,
  AiSkill,
  AiSkillPayload,
  AiSkillQuery,
  PageResult,
} from '@/types';

/** tinyint 列在不同驱动下可能返回字符串，统一成 number */
function normalizeModel(model: AiModelConfig): AiModelConfig {
  return {
    ...model,
    status: Number(model.status) === 1 ? 1 : 0,
    isDefault: Number(model.isDefault) === 1 ? 1 : 0,
    maxTokens: Number(model.maxTokens),
    temperature: Number(model.temperature),
    timeoutMs: Number(model.timeoutMs),
    skillIds: (model.skillIds ?? []).map((id) => Number(id)),
  };
}

/** GET /ai/models */
export async function fetchAiModels(params: AiModelQuery): Promise<PageResult<AiModelConfig>> {
  const result = await http.get<PageResult<AiModelConfig>>('/ai/models', params);
  return { ...result, list: result.list.map(normalizeModel) };
}

/** GET /ai/models/:id */
export async function fetchAiModelDetail(id: string): Promise<AiModelConfig> {
  return normalizeModel(await http.get<AiModelConfig>(`/ai/models/${id}`));
}

/** POST /ai/models */
export async function createAiModel(payload: AiModelPayload): Promise<AiModelConfig> {
  return normalizeModel(await http.post<AiModelConfig>('/ai/models', payload));
}

/** PUT /ai/models —— id 从 Body 传入 */
export async function updateAiModel(
  payload: AiModelPayload & { id: string },
): Promise<AiModelConfig> {
  return normalizeModel(await http.put<AiModelConfig>('/ai/models', payload));
}

/** DELETE /ai/models/:id */
export function deleteAiModel(id: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/ai/models/${id}`);
}

/** GET /ai/skills */
export function fetchAiSkills(params: AiSkillQuery): Promise<PageResult<AiSkill>> {
  return http.get<PageResult<AiSkill>>('/ai/skills', params);
}

/** GET /ai/skills/:id —— 返回 Markdown 正文 */
export function fetchAiSkillDetail(id: string): Promise<AiSkill> {
  return http.get<AiSkill>(`/ai/skills/${id}`);
}

function toSkillFormData(payload: AiSkillPayload): FormData {
  const form = new FormData();
  form.append('skillName', payload.skillName);
  if (payload.description) {
    form.append('description', payload.description);
  }
  if (payload.file) {
    form.append('file', payload.file);
  }
  return form;
}

/** POST /ai/skills —— multipart，file 必传且必须是 .md */
export function createAiSkill(payload: AiSkillPayload): Promise<AiSkill> {
  return http.post<AiSkill>('/ai/skills', toSkillFormData(payload));
}

/** PUT /ai/skills —— multipart，file 可选（不传表示保留原文件） */
export function updateAiSkill(payload: AiSkillPayload): Promise<AiSkill> {
  return http.put<AiSkill>('/ai/skills', toSkillFormData(payload));
}

/** DELETE /ai/skills/:id */
export function deleteAiSkill(id: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/ai/skills/${id}`);
}
