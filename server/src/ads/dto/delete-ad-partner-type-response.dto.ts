import { ApiProperty } from '@nestjs/swagger';

export class DeleteAdPartnerTypeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '2' })
  id: string;
}
