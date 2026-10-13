import { ApiProperty } from '@nestjs/swagger';
import { AdCampaignResponseDto } from './ad-campaign-response.dto';

export class AdCampaignPageResponseDto {
  @ApiProperty({ type: [AdCampaignResponseDto] })
  list: AdCampaignResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
