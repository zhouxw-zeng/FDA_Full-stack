import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { AiModelConfigResponseDto } from './dto/ai-model-config-response.dto';
import { CreateAiModelConfigDto } from './dto/create-ai-model-config.dto';
import { QueryAiModelConfigDto } from './dto/query-ai-model-config.dto';
import { UpdateAiModelConfigDto } from './dto/update-ai-model-config.dto';
import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiSkill } from './entities/ai-skill.entity';

@Injectable()
export class AiModelsService {
  constructor(
    @InjectRepository(AiModelConfig)
    private readonly modelsRepository: Repository<AiModelConfig>,
    @InjectRepository(AiSkill)
    private readonly skillsRepository: Repository<AiSkill>,
    private readonly configService: ConfigService,
  ) {}

  async create(createAiModelConfigDto: CreateAiModelConfigDto) {
    const { skillIds, ...configData } = createAiModelConfigDto;
    await this.ensureUnique(configData.providerCode, configData.modelName);

    if (configData.isDefault === 1) {
      await this.clearDefault(configData.providerCode);
    }

    const model = this.modelsRepository.create(configData);
    model.skills = await this.getSkillsByIds(skillIds);
    return this.toResponse(await this.modelsRepository.save(model));
  }

  async findAll(queryAiModelConfigDto: QueryAiModelConfigDto) {
    const { keyword, providerCode, status } = queryAiModelConfigDto;
    const { page, size, skip } = resolvePagination(queryAiModelConfigDto);
    const query = this.modelsRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.skills', 'skill')
      .addSelect('model.apiKey');

    if (keyword) {
      query.andWhere(
        '(model.providerName LIKE :keyword OR model.modelName LIKE :keyword OR model.displayName LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (providerCode) {
      query.andWhere('model.providerCode = :providerCode', { providerCode });
    }
    if (status !== undefined) {
      query.andWhere('model.status = :status', { status });
    }

    const [list, total] = await query
      .orderBy('model.isDefault', 'DESC')
      .addOrderBy('model.id', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((model) => this.toResponse(model)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getModelOrThrow(id));
  }

  async update(updateAiModelConfigDto: UpdateAiModelConfigDto) {
    const { id, skillIds, ...changes } = updateAiModelConfigDto;
    const model = await this.getModelOrThrow(id);

    if (changes.providerCode || changes.modelName) {
      await this.ensureUnique(
        changes.providerCode ?? model.providerCode,
        changes.modelName ?? model.modelName,
        id,
      );
    }
    if (changes.isDefault === 1) {
      await this.clearDefault(changes.providerCode ?? model.providerCode, id);
    }

    Object.assign(model, changes);
    if (skillIds !== undefined) {
      model.skills = await this.getSkillsByIds(skillIds);
    }
    return this.toResponse(await this.modelsRepository.save(model));
  }

  async remove(id: string) {
    await this.getModelOrThrow(id);
    await this.modelsRepository.delete(id);
    return { success: true, id };
  }

  async getRuntimeConfig(id?: string): Promise<AiModelConfig> {
    const query = this.modelsRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.skills', 'skill')
      .addSelect('model.apiKey')
      .where('model.status = 0');

    if (id) {
      query.andWhere('model.id = :id', { id });
    } else {
      query.orderBy('model.isDefault', 'DESC').addOrderBy('model.id', 'ASC');
    }

    const model = await query.getOne();
    if (!model) {
      throw new NotFoundException(id ? `AI 模型配置 ${id} 不存在` : '没有可用的 AI 模型配置');
    }

    const envKey =
      model.providerCode === 'DEEPSEEK'
        ? this.configService.get<string>('DEEPSEEK_API_KEY')
        : undefined;
    model.apiKey = model.apiKey || envKey || null;

    return model;
  }

  buildSystemPrompt(model: AiModelConfig): string {
    const prompts = [
      model.systemPrompt?.trim(),
      ...(model.skills ?? [])
        .filter((skill) => skill.status === 0)
        .map((skill) => skill.fileContent.trim()),
    ].filter(Boolean);

    return prompts.length
      ? prompts.join('\n\n')
      : '你是全栈 FDE 管理后台的 AI 助手，请给出准确、简洁、可执行的中文结果。';
  }

  private async getModelOrThrow(id: string): Promise<AiModelConfig> {
    const model = await this.modelsRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.skills', 'skill')
      .addSelect('model.apiKey')
      .where('model.id = :id', { id })
      .getOne();

    if (!model) {
      throw new NotFoundException(`AI 模型配置 ${id} 不存在`);
    }

    return model;
  }

  private async getSkillsByIds(skillIds?: number[]): Promise<AiSkill[]> {
    if (!skillIds?.length) {
      return [];
    }

    return this.skillsRepository.findBy({
      id: In(skillIds.map(String)),
      status: 0,
    });
  }

  private async ensureUnique(
    providerCode: string,
    modelName: string,
    excludeId?: string,
  ): Promise<void> {
    const model = await this.modelsRepository.findOne({
      where: {
        providerCode,
        modelName,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      select: { id: true },
    });

    if (model) {
      throw new ConflictException(`${providerCode}/${modelName} 模型配置已存在`);
    }
  }

  private async clearDefault(providerCode: string, excludeId?: string): Promise<void> {
    await this.modelsRepository.update(
      {
        providerCode,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      { isDefault: 0 },
    );
  }

  private toResponse(model: AiModelConfig): AiModelConfigResponseDto {
    return {
      id: model.id,
      providerCode: model.providerCode,
      providerName: model.providerName,
      baseUrl: model.baseUrl,
      hasApiKey: Boolean(model.apiKey),
      modelName: model.modelName,
      displayName: model.displayName,
      status: model.status,
      isDefault: model.isDefault,
      maxTokens: model.maxTokens,
      temperature: model.temperature,
      timeoutMs: model.timeoutMs,
      extraConfig: model.extraConfig,
      systemPrompt: model.systemPrompt,
      skillIds: (model.skills ?? []).map((skill) => Number(skill.id)),
      skills: (model.skills ?? []).map((skill) => ({
        id: skill.id,
        skillName: skill.skillName,
        description: skill.description,
        fileName: skill.fileName,
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
