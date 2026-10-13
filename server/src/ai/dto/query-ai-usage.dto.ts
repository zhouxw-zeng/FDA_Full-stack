import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryAiUsageDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'DEEPSEEK' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  providerCode?: string;

  @ApiPropertyOptional({ example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelName?: string;

  @ApiPropertyOptional({ example: 'success', enum: ['success', 'failed'] })
  @IsOptional()
  @IsIn(['success', 'failed'])
  status?: 'success' | 'failed';

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
