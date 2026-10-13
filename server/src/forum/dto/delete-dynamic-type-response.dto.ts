import { ApiProperty } from '@nestjs/swagger';

export class DeleteDynamicTypeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1 })
  typeId: number;
}
