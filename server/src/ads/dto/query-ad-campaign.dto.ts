import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryAdCampaignDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '促销' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @ApiPropertyOptional({ example: 'feed', enum: ['feed', 'banner', 'video_pre', 'splash'] })
  @IsOptional()
  @IsIn(['feed', 'banner', 'video_pre', 'splash'])
  placement?: 'feed' | 'banner' | 'video_pre' | 'splash';

  @ApiPropertyOptional({ example: 'running', enum: ['running', 'paused', 'ended', 'draft'] })
  @IsOptional()
  @IsIn(['running', 'paused', 'ended', 'draft'])
  status?: 'running' | 'paused' | 'ended' | 'draft';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partnerTypeId?: number;
}
