import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateAdPartnerTypeDto } from './dto/create-ad-partner-type.dto';
import { QueryAdPartnerTypeDto } from './dto/query-ad-partner-type.dto';
import { UpdateAdPartnerTypeDto } from './dto/update-ad-partner-type.dto';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdPartnerType } from './entities/ad-partner-type.entity';

@Injectable()
export class AdPartnerTypesService {
  constructor(
    @InjectRepository(AdPartnerType)
    private readonly partnerTypesRepository: Repository<AdPartnerType>,
    @InjectRepository(AdCampaign)
    private readonly campaignsRepository: Repository<AdCampaign>,
  ) {}

  async create(createAdPartnerTypeDto: CreateAdPartnerTypeDto) {
    await this.ensureUnique(createAdPartnerTypeDto.typeName, createAdPartnerTypeDto.typeCode);

    const partnerType = this.partnerTypesRepository.create(createAdPartnerTypeDto);
    return this.toResponse(await this.partnerTypesRepository.save(partnerType));
  }

  async findAll(queryAdPartnerTypeDto: QueryAdPartnerTypeDto) {
    const { keyword, status, requiresKey } = queryAdPartnerTypeDto;
    const { page, size, skip } = resolvePagination(queryAdPartnerTypeDto);
    const query = this.partnerTypesRepository.createQueryBuilder('partnerType');

    if (keyword) {
      query.andWhere(
        '(partnerType.typeName LIKE :keyword OR partnerType.typeCode LIKE :keyword OR partnerType.remark LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status !== undefined) {
      query.andWhere('partnerType.status = :status', { status });
    }
    if (requiresKey !== undefined) {
      query.andWhere('partnerType.requiresKey = :requiresKey', { requiresKey });
    }

    const [list, total] = await query
      .orderBy('partnerType.id', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((partnerType) => this.toResponse(partnerType)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getPartnerTypeOrThrow(id));
  }

  async update(updateAdPartnerTypeDto: UpdateAdPartnerTypeDto) {
    const { id, ...changes } = updateAdPartnerTypeDto;
    const partnerType = await this.getPartnerTypeOrThrow(id);

    await this.ensureUnique(changes.typeName, changes.typeCode, id);
    Object.assign(partnerType, changes);

    return this.toResponse(await this.partnerTypesRepository.save(partnerType));
  }

  async remove(id: string) {
    await this.getPartnerTypeOrThrow(id);
    const campaignCount = await this.campaignsRepository.countBy({
      partnerTypeId: id,
    });

    if (campaignCount > 0) {
      throw new ConflictException(`该对接方类型已被 ${campaignCount} 个广告计划使用，不能删除`);
    }

    await this.partnerTypesRepository.delete(id);
    return { success: true, id };
  }

  private async ensureUnique(
    typeName?: string,
    typeCode?: string,
    excludeId?: string,
  ): Promise<void> {
    if (typeName) {
      const nameExists = await this.partnerTypesRepository.findOne({
        where: {
          typeName,
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
        select: { id: true },
      });

      if (nameExists) {
        throw new ConflictException(`对接方类型名称“${typeName}”已存在`);
      }
    }

    if (typeCode) {
      const codeExists = await this.partnerTypesRepository.findOne({
        where: {
          typeCode,
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
        select: { id: true },
      });

      if (codeExists) {
        throw new ConflictException(`对接方类型编码“${typeCode}”已存在`);
      }
    }
  }

  private async getPartnerTypeOrThrow(id: string): Promise<AdPartnerType> {
    const partnerType = await this.partnerTypesRepository.findOneBy({ id });

    if (!partnerType) {
      throw new NotFoundException(`广告对接方类型 ${id} 不存在`);
    }

    return partnerType;
  }

  private toResponse(partnerType: AdPartnerType) {
    return {
      id: partnerType.id,
      typeName: partnerType.typeName,
      typeCode: partnerType.typeCode,
      remark: partnerType.remark,
      integrationUrl: partnerType.integrationUrl,
      status: partnerType.status,
      requiresKey: partnerType.requiresKey,
      keyId: partnerType.keyId,
      keySecret: partnerType.keySecret,
      createdAt: partnerType.createdAt,
      updatedAt: partnerType.updatedAt,
    };
  }
}
