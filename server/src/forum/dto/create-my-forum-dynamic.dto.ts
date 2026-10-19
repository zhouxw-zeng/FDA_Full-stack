import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ForumMediaItemDto } from './forum-media-item.dto';

export class CreateMyForumDynamicDto {
  @ApiProperty({ example: '周末的海边', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: '请填写动态标题' })
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '今天去海边走了走，风很舒服。', maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ example: 1, description: '动态类型 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ example: '日常', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @ApiPropertyOptional({ type: [ForumMediaItemDto], description: '最多 9 个图片/视频素材' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => ForumMediaItemDto)
  media?: ForumMediaItemDto[];
}
