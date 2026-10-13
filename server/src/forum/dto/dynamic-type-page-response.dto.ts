import { ApiProperty } from '@nestjs/swagger';
import { DynamicTypeResponseDto } from './dynamic-type-response.dto';

export class DynamicTypePageResponseDto {
  @ApiProperty({ type: [DynamicTypeResponseDto] })
  list: DynamicTypeResponseDto[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
