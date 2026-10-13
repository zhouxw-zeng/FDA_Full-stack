import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from './role-response.dto';

export class RolePageResponseDto {
  @ApiProperty({ type: [RoleResponseDto] })
  list: RoleResponseDto[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
