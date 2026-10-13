import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryAdPartnerTypeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '引擎' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ example: 1, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  requiresKey?: number;
}
