import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export type ForumCommentSort = 'likes' | 'latest' | 'replies';

export class QueryForumCommentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'likes',
    enum: ['likes', 'latest', 'replies'],
    default: 'likes',
    description: '一级评论排序：likes 最高点赞，latest 最新，replies 最多评论',
  })
  @IsOptional()
  @IsIn(['likes', 'latest', 'replies'])
  sort?: ForumCommentSort;
}
