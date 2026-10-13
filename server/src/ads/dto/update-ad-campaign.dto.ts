import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { CreateAdCampaignDto } from './create-ad-campaign.dto';

export class UpdateAdCampaignDto extends PartialType(CreateAdCampaignDto) {
  @ApiProperty({ example: '1', description: '要更新的广告计划 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;
}
