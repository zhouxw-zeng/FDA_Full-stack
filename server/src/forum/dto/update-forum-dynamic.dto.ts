import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ForumMediaItemDto } from './forum-media-item.dto';

export class UpdateForumDynamicDto {
  @ApiProperty({ example: 'D-5000', description: '动态记录 ID' })
  @IsString()
  @MaxLength(32)
  id: string;

  @ApiPropertyOptional({ example: '更新后的动态内容' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: '更新后的动态标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 2, description: '动态类型 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ type: [ForumMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForumMediaItemDto)
  media?: ForumMediaItemDto[];

  @ApiProperty({ example: 'customer', enum: ['customer', 'admin'] })
  @IsIn(['customer', 'admin'])
  editorType: 'customer' | 'admin';

  @ApiPropertyOptional({
    example: '1',
    description: 'C 端编辑者 ID；editorType=admin 时可省略',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'editorId 必须是正整数',
  })
  editorId?: string;

  @ApiPropertyOptional({ example: '用户修改动态内容', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ example: 'https://example.com/source.jpg' })
  @IsOptional()
  @IsString()
  attachments?: string;
}
