import type { PageQuery } from './common';

/** AI 技能：GET /ai/skills */
export interface AiSkill {
  id: string;
  skillName: string;
  description: string | null;
  /** 上传时的 Markdown 文件名 */
  fileName: string;
  /** Markdown 正文，保存在后端 ai_skills.file_content */
  fileContent: string;
  /** 本地文件上传接口返回的地址，保存在后端 ai_skills.file_url */
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiSkillQuery extends PageQuery {
  keyword?: string;
}

export interface AiSkillPayload {
  id?: string;
  skillName: string;
  description?: string;
  /** 本地文件上传接口返回的地址；传地址时后端按地址回读文件内容 */
  fileUrl?: string;
  file?: File;
}

/** AI 模型配置：GET /ai/models */
export interface AiModelConfig {
  id: string;
  providerCode: string;
  providerName: string;
  baseUrl: string;
  /** 后端只返回是否已配置 API Key，不回传明文 */
  apiKey: string| null;
  hasApiKey: boolean;
  modelName: string;
  displayName: string;
  /** 0 启用，1 禁用 */
  status: number;
  /** 1 默认模型 */
  isDefault: number;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  extraConfig: Record<string, unknown> | null;
  systemPrompt: string | null;
  skillIds: number[];
  skills: { id?: string; skillName?: string; fileName?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface AiModelQuery extends PageQuery {
  providerCode?: string;
  status?: number | '';
}

export interface AiModelPayload {
  id?: string;
  providerCode: string;
  providerName: string;
  baseUrl: string;
  /** 留空表示不修改已保存的 Key */
  apiKey?: string;
  modelName: string;
  displayName: string;
  status?: number;
  isDefault?: number;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  systemPrompt?: string;
  skillIds?: number[];
}

