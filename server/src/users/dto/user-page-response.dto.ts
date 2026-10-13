import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class UserPageResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  list: UserResponseDto[];

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
