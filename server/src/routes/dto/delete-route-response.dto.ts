import { ApiProperty } from '@nestjs/swagger';

export class DeleteRouteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1 })
  routeId: number;
}
