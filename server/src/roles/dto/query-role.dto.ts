import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryRoleDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '审核' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
