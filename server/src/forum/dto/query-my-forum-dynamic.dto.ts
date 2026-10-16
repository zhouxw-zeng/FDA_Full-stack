import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { QueryForumDynamicDto } from './query-forum-dynamic.dto';

export type MyForumDynamicStatus = 'published' | 'pending' | 'rejected';

export class QueryMyForumDynamicDto extends QueryForumDynamicDto {
  @ApiPropertyOptional({
    enum: ['published', 'pending', 'rejected'],
    description: '已发布：审批通过且启用；审批中：pending；已驳回：rejected',
  })
  @IsOptional()
  @IsIn(['published', 'pending', 'rejected'])
  status?: MyForumDynamicStatus;
}
