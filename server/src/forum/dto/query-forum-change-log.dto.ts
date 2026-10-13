import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryForumChangeLogDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'D-5000' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  targetId?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'ownerId 必须是正整数',
  })
  ownerId?: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['customer', 'admin'] })
  @IsOptional()
  @IsIn(['customer', 'admin'])
  editorType?: 'customer' | 'admin';

  @ApiPropertyOptional({ example: 'audit' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  action?: string;

  @ApiPropertyOptional({ example: '审核通过' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  keyword?: string;
}
