import { ApiProperty } from '@nestjs/swagger';

export class AdCampaignResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '秋季器材促销 1 期' })
  name: string;

  @ApiProperty({ example: '星野影像器材' })
  advertiser: string;

  @ApiProperty({ example: '1', nullable: true })
  partnerTypeId: string | null;

  @ApiProperty({ example: '自有广告', nullable: true })
  partnerTypeName: string | null;

  @ApiProperty({ example: 'feed', enum: ['feed', 'banner', 'video_pre', 'splash'] })
  placement: string;

  @ApiProperty({ example: 'running', enum: ['running', 'paused', 'ended', 'draft'] })
  status: string;

  @ApiProperty({ example: 80000 })
  budget: number;

  @ApiProperty({ example: 36500 })
  spent: number;

  @ApiProperty({ example: 1280000 })
  impressions: number;

  @ApiProperty({ example: 18600 })
  clicks: number;

  @ApiProperty({ example: '2026-10-20T00:00:00.000Z' })
  startAt: Date;

  @ApiProperty({ example: '2026-11-20T23:59:59.000Z' })
  endAt: Date;

  @ApiProperty({ example: 1001 })
  seed: number;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}
