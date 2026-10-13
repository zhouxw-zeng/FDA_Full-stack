import { ApiProperty } from '@nestjs/swagger';
import { RouteResponseDto } from './route-response.dto';

export class RoutePageResponseDto {
  @ApiProperty({ type: [RouteResponseDto] })
  list: RouteResponseDto[];

  @ApiProperty({ example: 13 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
