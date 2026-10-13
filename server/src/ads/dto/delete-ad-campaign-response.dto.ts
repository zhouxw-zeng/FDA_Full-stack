import { ApiProperty } from '@nestjs/swagger';

export class DeleteAdCampaignResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '1' })
  id: string;
}
