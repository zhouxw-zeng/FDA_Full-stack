import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { QueryAdCampaignDto } from './dto/query-ad-campaign.dto';
import { UpdateAdCampaignDto } from './dto/update-ad-campaign.dto';
import { UpdateAdStatusDto } from './dto/update-ad-status.dto';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdPartnerType } from './entities/ad-partner-type.entity';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(AdCampaign)
    private readonly campaignsRepository: Repository<AdCampaign>,
    @InjectRepository(AdPartnerType)
    private readonly partnerTypesRepository: Repository<AdPartnerType>,
  ) {}

  async create(createAdCampaignDto: CreateAdCampaignDto) {
    const partnerType = await this.getPartnerTypeOrNull(createAdCampaignDto.partnerTypeId);
    const campaign = this.campaignsRepository.create({
      ...createAdCampaignDto,
      partnerType,
      partnerTypeId: partnerType?.id ?? null,
      startAt: new Date(createAdCampaignDto.startAt),
      endAt: new Date(createAdCampaignDto.endAt),
      status: 'draft',
      spent: 0,
      impressions: 0,
      clicks: 0,
      seed: createAdCampaignDto.seed ?? 1,
    });

    return this.toResponse(await this.campaignsRepository.save(campaign));
  }

  async findAll(queryAdCampaignDto: QueryAdCampaignDto) {
    const { keyword, placement, status, partnerTypeId } = queryAdCampaignDto;
    const { page, size, skip } = resolvePagination(queryAdCampaignDto);
    const query = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.partnerType', 'partnerType');

    if (keyword) {
      query.andWhere('(campaign.name LIKE :keyword OR campaign.advertiser LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }
    if (placement) {
      query.andWhere('campaign.placement = :placement', { placement });
    }
    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }
    if (partnerTypeId !== undefined) {
      query.andWhere('campaign.partnerTypeId = :partnerTypeId', {
        partnerTypeId: String(partnerTypeId),
      });
    }

    const [list, total] = await query
      .orderBy('campaign.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((campaign) => this.toResponse(campaign)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getCampaignOrThrow(id));
  }

  async update(updateAdCampaignDto: UpdateAdCampaignDto) {
    const id = updateAdCampaignDto.id;
    const campaign = await this.getCampaignOrThrow(id);

    if (updateAdCampaignDto.partnerTypeId !== undefined) {
      campaign.partnerType = await this.getPartnerTypeOrNull(updateAdCampaignDto.partnerTypeId);
      campaign.partnerTypeId = campaign.partnerType?.id ?? null;
    }

    if (updateAdCampaignDto.name !== undefined) {
      campaign.name = updateAdCampaignDto.name;
    }
    if (updateAdCampaignDto.advertiser !== undefined) {
      campaign.advertiser = updateAdCampaignDto.advertiser;
    }
    if (updateAdCampaignDto.placement !== undefined) {
      campaign.placement = updateAdCampaignDto.placement;
    }
    if (updateAdCampaignDto.budget !== undefined) {
      campaign.budget = updateAdCampaignDto.budget;
    }
    if (updateAdCampaignDto.startAt !== undefined) {
      campaign.startAt = new Date(updateAdCampaignDto.startAt);
    }
    if (updateAdCampaignDto.endAt !== undefined) {
      campaign.endAt = new Date(updateAdCampaignDto.endAt);
    }
    if (updateAdCampaignDto.seed !== undefined) {
      campaign.seed = updateAdCampaignDto.seed;
    }

    return this.toResponse(await this.campaignsRepository.save(campaign));
  }

  async updateStatus(updateAdStatusDto: UpdateAdStatusDto) {
    const campaign = await this.getCampaignOrThrow(updateAdStatusDto.id);
    campaign.status = updateAdStatusDto.status;
    return this.toResponse(await this.campaignsRepository.save(campaign));
  }

  async remove(id: string) {
    await this.getCampaignOrThrow(id);
    await this.campaignsRepository.delete(id);
    return { success: true, id };
  }

  private async getPartnerTypeOrNull(partnerTypeId?: number): Promise<AdPartnerType | null> {
    if (partnerTypeId === undefined) {
      return null;
    }

    const partnerType = await this.partnerTypesRepository.findOneBy({
      id: String(partnerTypeId),
    });

    if (!partnerType) {
      throw new NotFoundException(`广告对接方类型 ${partnerTypeId} 不存在`);
    }

    return partnerType;
  }

  private async getCampaignOrThrow(id: string): Promise<AdCampaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: { partnerType: true },
    });

    if (!campaign) {
      throw new NotFoundException(`广告计划 ${id} 不存在`);
    }

    return campaign;
  }

  private toResponse(campaign: AdCampaign) {
    return {
      id: campaign.id,
      name: campaign.name,
      advertiser: campaign.advertiser,
      partnerTypeId: campaign.partnerTypeId,
      partnerTypeName: campaign.partnerType?.typeName ?? null,
      placement: campaign.placement,
      status: campaign.status,
      budget: campaign.budget,
      spent: campaign.spent,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      seed: campaign.seed,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}
