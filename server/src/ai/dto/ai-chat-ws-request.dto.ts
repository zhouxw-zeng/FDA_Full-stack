import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AiChatRequestDto } from './ai-chat-request.dto';

export class AiChatWsRequestDto extends AiChatRequestDto {
  @ApiPropertyOptional({
    example: 'ws-chat-001',
    description: '客户端请求 ID，用于对应 chat:start、chat:reply 和 chat:error 事件',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}
