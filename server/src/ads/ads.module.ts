import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdPartnerTypesController } from './ad-partner-types.controller';
import { AdPartnerTypesService } from './ad-partner-types.service';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdPartnerType } from './entities/ad-partner-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdCampaign, AdPartnerType])],
  controllers: [AdPartnerTypesController, AdsController],
  providers: [AdPartnerTypesService, AdsService],
  exports: [AdPartnerTypesService, AdsService],
})
export class AdsModule {}
