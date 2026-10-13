import { ApiProperty } from '@nestjs/swagger';
import { ForumChangeLogResponseDto } from './forum-change-log-response.dto';

export class ForumChangeLogPageResponseDto {
  @ApiProperty({ type: [ForumChangeLogResponseDto] })
  list: ForumChangeLogResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
