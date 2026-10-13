import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiAttachmentDto {
  @ApiProperty({ example: '需求文档.txt' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'text/plain' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiProperty({ example: '这是附件文本内容。' })
  @IsString()
  content: string;
}
