import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryDynamicTypeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '夜景' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1], description: '0 启用，1 禁用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}
