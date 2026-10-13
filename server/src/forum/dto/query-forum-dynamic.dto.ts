import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryForumDynamicDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '老码头' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ example: '城市夜景' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @ApiPropertyOptional({ example: 2, description: '动态类型 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    const rawValue = value as unknown;
    if (rawValue === 'true' || rawValue === true) {
      return true;
    }
    if (rawValue === 'false' || rawValue === false) {
      return false;
    }
    return rawValue;
  })
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ example: 'approved', enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  auditStatus?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 1, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  enabled?: number;
}
