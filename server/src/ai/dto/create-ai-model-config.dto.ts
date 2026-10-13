import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAiModelConfigDto {
  @ApiProperty({ example: 'DEEPSEEK', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'providerCode 只能包含大写字母、数字、下划线和短横线',
  })
  providerCode: string;

  @ApiProperty({ example: 'DeepSeek', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  providerName: string;

  @ApiProperty({ example: 'https://api.deepseek.com/v1' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  baseUrl: string;

  @ApiPropertyOptional({ example: '', description: 'API Key，可留空后人工维护' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  apiKey?: string;

  @ApiProperty({ example: 'deepseek-chat', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  modelName: string;

  @ApiProperty({ example: 'DeepSeek Chat', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ example: 1, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  isDefault?: number;

  @ApiPropertyOptional({ example: 2048 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  timeoutMs?: number;

  @ApiPropertyOptional({ example: { compatibility: 'openai' } })
  @IsOptional()
  @IsObject()
  extraConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '你是后台运营助手，请根据用户选择的技能返回简洁结果。',
    description: '模型默认 System Prompt',
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ example: [1, 3], description: '选中的通用技能 ID 组' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  skillIds?: number[];
}
