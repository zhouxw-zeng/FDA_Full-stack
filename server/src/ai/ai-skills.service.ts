import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateAiSkillDto } from './dto/create-ai-skill.dto';
import { QueryAiSkillDto } from './dto/query-ai-skill.dto';
import { UpdateAiSkillDto } from './dto/update-ai-skill.dto';
import { AiSkill } from './entities/ai-skill.entity';

export interface UploadedMarkdownFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class AiSkillsService {
  constructor(
    @InjectRepository(AiSkill)
    private readonly skillsRepository: Repository<AiSkill>,
  ) {}

  async create(createAiSkillDto: CreateAiSkillDto, file?: UploadedMarkdownFile) {
    await this.ensureUnique(createAiSkillDto.skillName);
    const markdown = this.readMarkdownFile(file);
    const skill = this.skillsRepository.create({
      ...createAiSkillDto,
      fileName: markdown.fileName,
      fileContent: markdown.fileContent,
      status: 0,
    });

    return this.toResponse(await this.skillsRepository.save(skill));
  }

  async findAll(queryAiSkillDto: QueryAiSkillDto) {
    const { keyword } = queryAiSkillDto;
    const { page, size, skip } = resolvePagination(queryAiSkillDto);
    const query = this.skillsRepository.createQueryBuilder('skill');

    if (keyword) {
      query.andWhere('(skill.skillName LIKE :keyword OR skill.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await query
      .orderBy('skill.id', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((skill) => this.toResponse(skill)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getSkillOrThrow(id));
  }

  async update(updateAiSkillDto: UpdateAiSkillDto, file?: UploadedMarkdownFile) {
    const { id, ...changes } = updateAiSkillDto;
    const skill = await this.getSkillOrThrow(id);

    if (changes.skillName) {
      await this.ensureUnique(changes.skillName, id);
    }

    Object.assign(skill, changes);
    if (file) {
      const markdown = this.readMarkdownFile(file);
      skill.fileName = markdown.fileName;
      skill.fileContent = markdown.fileContent;
    }

    return this.toResponse(await this.skillsRepository.save(skill));
  }

  async remove(id: string) {
    await this.getSkillOrThrow(id);
    await this.skillsRepository.delete(id);
    return { success: true, id };
  }

  private async ensureUnique(skillName: string, excludeId?: string): Promise<void> {
    const skill = await this.skillsRepository.findOne({
      where: {
        skillName,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
      select: { id: true },
    });

    if (skill) {
      throw new ConflictException(`技能名称“${skillName}”已存在`);
    }
  }

  private readMarkdownFile(file?: UploadedMarkdownFile): {
    fileName: string;
    fileContent: string;
  } {
    if (!file) {
      throw new BadRequestException('请上传 Markdown 技能文件');
    }

    if (!file.originalname.toLowerCase().endsWith('.md')) {
      throw new BadRequestException('技能文件必须是 .md 文件');
    }

    const fileContent = file.buffer.toString('utf8').trim();
    if (!fileContent) {
      throw new BadRequestException('Markdown 技能文件内容不能为空');
    }

    return {
      fileName: file.originalname,
      fileContent,
    };
  }

  private async getSkillOrThrow(id: string): Promise<AiSkill> {
    const skill = await this.skillsRepository.findOneBy({ id });

    if (!skill) {
      throw new NotFoundException(`AI 技能 ${id} 不存在`);
    }

    return skill;
  }

  private toResponse(skill: AiSkill) {
    return {
      id: skill.id,
      skillName: skill.skillName,
      description: skill.description,
      fileName: skill.fileName,
      fileContent: skill.fileContent,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }
}
