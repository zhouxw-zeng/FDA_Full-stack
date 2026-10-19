import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QuerySocialUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '小' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;
}
