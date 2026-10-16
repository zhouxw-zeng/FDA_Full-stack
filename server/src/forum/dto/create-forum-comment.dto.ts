import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateForumCommentDto {
  @ApiProperty({ example: 'D-6001' })
  @IsString()
  @MaxLength(32)
  dynamicId: string;

  @ApiProperty({ example: '这张照片的光线很好看。' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ example: '12', description: '回复的评论 ID' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  parentId?: string;

  @ApiPropertyOptional({ example: 'comment-request-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}
