import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryRouteDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '论坛' })
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

  @ApiPropertyOptional({ example: 0, enum: [0, 1], description: '0 目录，1 菜单' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  routeType?: number;
}
