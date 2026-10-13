import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'alice' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
