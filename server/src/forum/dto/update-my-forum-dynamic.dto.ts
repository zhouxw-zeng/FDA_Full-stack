import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ForumMediaItemDto } from './forum-media-item.dto';

export class UpdateMyForumDynamicDto {
  @ApiPropertyOptional({ example: '更新后的动态标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '更新后的动态内容' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

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

  @ApiPropertyOptional({ example: '用户修改动态内容', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
