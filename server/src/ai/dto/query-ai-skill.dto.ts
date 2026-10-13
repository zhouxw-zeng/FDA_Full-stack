import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryAiSkillDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '图片' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
