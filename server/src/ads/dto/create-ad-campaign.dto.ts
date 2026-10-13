import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdCampaignDto {
  @ApiProperty({ example: '秋季器材促销 1 期', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '星野影像器材', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  advertiser: string;

  @ApiPropertyOptional({ example: 1, description: '广告对接方类型 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partnerTypeId?: number;

  @ApiProperty({ example: 'feed', enum: ['feed', 'banner', 'video_pre', 'splash'] })
  @IsIn(['feed', 'banner', 'video_pre', 'splash'])
  placement: 'feed' | 'banner' | 'video_pre' | 'splash';

  @ApiProperty({ example: 80000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget: number;

  @ApiProperty({ example: '2026-10-20T00:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-11-20T23:59:59.000Z' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ example: 1001 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seed?: number;
}
