import { ApiProperty } from '@nestjs/swagger';
import { AdPartnerTypeResponseDto } from './ad-partner-type-response.dto';

export class AdPartnerTypePageResponseDto {
  @ApiProperty({ type: [AdPartnerTypeResponseDto] })
  list: AdPartnerTypeResponseDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}
