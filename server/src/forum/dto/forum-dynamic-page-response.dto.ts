import { ApiProperty } from '@nestjs/swagger';
import { ForumDynamicResponseDto } from './forum-dynamic-response.dto';

export class ForumDynamicPageResponseDto {
  @ApiProperty({ type: [ForumDynamicResponseDto] })
  list: ForumDynamicResponseDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
