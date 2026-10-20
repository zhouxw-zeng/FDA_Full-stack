import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class QueryForumDynamicTitleDto extends PaginationQueryDto {
  @ApiProperty({ example: '虚拟数据', description: '动态标题模糊搜索关键词' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title 不能为空白字符' })
  @MaxLength(200)
  title: string;
}
