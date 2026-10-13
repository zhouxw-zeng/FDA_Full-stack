import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryCustomerDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '光圈' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ example: 'pending', enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  auditStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 1, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  enabled?: number;

  @ApiPropertyOptional({ example: 3, enum: [1, 2, 3, 4, 5] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3, 4, 5])
  vipLevel?: number;
}
