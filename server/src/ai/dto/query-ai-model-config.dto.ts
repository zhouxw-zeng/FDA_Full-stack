import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryAiModelConfigDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'DeepSeek' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ example: 'DEEPSEEK' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  providerCode?: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}
