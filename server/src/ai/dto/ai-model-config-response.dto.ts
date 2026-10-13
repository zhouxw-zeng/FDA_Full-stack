import { ApiProperty } from '@nestjs/swagger';

export class AiModelConfigResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'DEEPSEEK' })
  providerCode: string;

  @ApiProperty({ example: 'DeepSeek' })
  providerName: string;

  @ApiProperty({ example: 'https://api.deepseek.com/v1' })
  baseUrl: string;

  @ApiProperty({ example: false, description: '是否已配置 API Key' })
  hasApiKey: boolean;

  @ApiProperty({ example: '', description: 'API Key，仅管理员接口返回' })
  apiKey: string;

  @ApiProperty({ example: 'deepseek-chat' })
  modelName: string;

  @ApiProperty({ example: 'DeepSeek Chat' })
  displayName: string;

  @ApiProperty({ example: 0, description: '0 启用，1 禁用' })
  status: number;

  @ApiProperty({ example: 1, description: '1 默认模型' })
  isDefault: number;

  @ApiProperty({ example: 2048 })
  maxTokens: number;

  @ApiProperty({ example: 0.7 })
  temperature: number;

  @ApiProperty({ example: 60000 })
  timeoutMs: number;

  @ApiProperty({ example: { compatibility: 'openai' }, nullable: true })
  extraConfig: Record<string, unknown> | null;

  @ApiProperty({
    example: '你是后台运营助手，请根据用户选择的技能返回简洁结果。',
    nullable: true,
  })
  systemPrompt: string | null;

  @ApiProperty({ example: [1, 3], type: [Number] })
  skillIds: number[];

  @ApiProperty({
    example: [{ id: '1', skillName: '通用助手', fileName: '通用助手.md' }],
  })
  skills: Array<Record<string, unknown>>;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}
