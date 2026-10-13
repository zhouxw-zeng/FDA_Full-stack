import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AiAttachmentDto } from './ai-attachment.dto';

export class AiChatRequestDto {
  @ApiProperty({ example: '请帮我总结这段内容。' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  message: string;

  @ApiPropertyOptional({ example: '1', description: '会话 ID，为空时创建新会话' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: '1', description: '模型配置 ID' })
  @IsOptional()
  @IsString()
  modelConfigId?: string;

  @ApiPropertyOptional({ type: [AiAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiAttachmentDto)
  attachments?: AiAttachmentDto[];
}
