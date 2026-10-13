import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateDynamicTypeDto } from './dto/create-dynamic-type.dto';
import { QueryDynamicTypeDto } from './dto/query-dynamic-type.dto';
import { UpdateDynamicTypeDto } from './dto/update-dynamic-type.dto';
import { ForumDynamicType } from './entities/forum-dynamic-type.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';

@Injectable()
export class ForumDynamicTypesService {
  constructor(
    @InjectRepository(ForumDynamicType)
    private readonly typesRepository: Repository<ForumDynamicType>,
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
  ) {}

  async create(createDynamicTypeDto: CreateDynamicTypeDto) {
    await this.ensureNameUnique(createDynamicTypeDto.typeName);
    const type = this.typesRepository.create(createDynamicTypeDto);
    return this.toResponse(await this.typesRepository.save(type));
  }

  async findAll(queryDynamicTypeDto: QueryDynamicTypeDto) {
    const { keyword, status } = queryDynamicTypeDto;
    const { page, size, skip } = resolvePagination(queryDynamicTypeDto);
    const query = this.typesRepository.createQueryBuilder('type');

    if (keyword) {
      query.andWhere('(type.typeName LIKE :keyword OR type.typeRemark LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }
    if (status !== undefined) {
      query.andWhere('type.status = :status', { status });
    }

    const [list, total] = await query
      .orderBy('type.typeId', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((type) => this.toResponse(type)),
      total,
      page,
      size,
    );
  }

  async findOne(typeId: string) {
    return this.toResponse(await this.getTypeOrThrow(typeId));
  }

  async update(updateDynamicTypeDto: UpdateDynamicTypeDto) {
    const { id: typeId, ...changes } = updateDynamicTypeDto;
    const type = await this.getTypeOrThrow(String(typeId));
    const previousName = type.typeName;

    if (updateDynamicTypeDto.typeName) {
      await this.ensureNameUnique(updateDynamicTypeDto.typeName, String(typeId));
    }

    Object.assign(type, changes);
    const saved = await this.typesRepository.save(type);

    if (changes.typeName && changes.typeName !== previousName) {
      await this.dynamicsRepository.update({ typeId: String(typeId) }, { topic: changes.typeName });
    }

    return this.toResponse(saved);
  }

  async remove(typeId: string) {
    await this.getTypeOrThrow(typeId);
    const dynamicCount = await this.dynamicsRepository.countBy({ typeId });

    if (dynamicCount > 0) {
      throw new ConflictException(`该类型下还有 ${dynamicCount} 条动态，不能删除`);
    }

    await this.typesRepository.delete(typeId);
    return { success: true, typeId: Number(typeId) };
  }

  private async ensureNameUnique(typeName: string, excludeTypeId?: string): Promise<void> {
    const type = await this.typesRepository.findOne({
      where: {
        typeName,
        ...(excludeTypeId ? { typeId: Not(excludeTypeId) } : {}),
      },
      select: { typeId: true },
    });

    if (type) {
      throw new ConflictException(`动态类型“${typeName}”已存在`);
    }
  }

  private async getTypeOrThrow(typeId: string): Promise<ForumDynamicType> {
    const type = await this.typesRepository.findOneBy({ typeId });

    if (!type) {
      throw new NotFoundException(`动态类型 ${typeId} 不存在`);
    }

    return type;
  }

  private toResponse(type: ForumDynamicType) {
    return {
      typeId: Number(type.typeId),
      typeName: type.typeName,
      typeRemark: type.typeRemark,
      status: type.status,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    };
  }
}
