import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
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
  private readonly localFileRoot: string;
  private readonly localFileUrlPrefix: string;

  constructor(
    @InjectRepository(AiSkill)
    private readonly skillsRepository: Repository<AiSkill>,
    private readonly configService: ConfigService,
  ) {
    this.localFileRoot = path.resolve(
      this.configService.get<string>('LOCAL_FILE_ROOT', 'E:\\ZXW\\local_file'),
    );
    this.localFileUrlPrefix =
      this.configService.get<string>('LOCAL_FILE_URL_PREFIX', '/local-files').replace(/\/+$/, '') ||
      '/local-files';
  }

  async create(createAiSkillDto: CreateAiSkillDto, file?: UploadedMarkdownFile) {
    await this.ensureUnique(createAiSkillDto.skillName);
    const markdown = await this.resolveMarkdown(file, createAiSkillDto.fileUrl);

    const skill = this.skillsRepository.create({
      skillName: createAiSkillDto.skillName,
      description: createAiSkillDto.description ?? null,
      fileName: markdown.fileName,
      fileContent: markdown.fileContent,
      fileUrl: createAiSkillDto.fileUrl ?? null,
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
    const { id, skillName, description, fileUrl } = updateAiSkillDto;
    const skill = await this.getSkillOrThrow(id);

    if (skillName) {
      await this.ensureUnique(skillName, id);
      skill.skillName = skillName;
    }
    if (description !== undefined) {
      skill.description = description ?? null;
    }
    if (fileUrl !== undefined) {
      skill.fileUrl = fileUrl;
    }

    // 重新上传文件或换了文件地址时，同步刷新文件信息与正文
    if (file || fileUrl) {
      const markdown = await this.resolveMarkdown(file, fileUrl);
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

  /**
   * 技能正文的两个来源：
   * 1. 直接上传 Markdown 文件（兼容原有调用）
   * 2. 传入本地上传接口返回的地址，由服务端按地址回读文件内容
   */
  private async resolveMarkdown(
    file?: UploadedMarkdownFile,
    fileUrl?: string,
  ): Promise<{ fileName: string; fileContent: string }> {
    if (file) {
      return this.readUploadedMarkdown(file);
    }
    if (fileUrl) {
      return this.readMarkdownFromLocalFile(fileUrl);
    }
    throw new BadRequestException('请上传 Markdown 技能文件，或提供本地文件上传接口返回的地址');
  }

  private readUploadedMarkdown(file: UploadedMarkdownFile): {
    fileName: string;
    fileContent: string;
  } {
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

  private async readMarkdownFromLocalFile(
    fileUrl: string,
  ): Promise<{ fileName: string; fileContent: string }> {
    const prefix = `${this.localFileUrlPrefix}/`;
    if (!fileUrl.startsWith(prefix)) {
      throw new BadRequestException(
        `fileUrl 必须是本地文件上传接口返回的地址（以 ${prefix} 开头）`,
      );
    }

    let relativePath: string;
    try {
      relativePath = decodeURIComponent(fileUrl.slice(prefix.length));
    } catch {
      throw new BadRequestException('fileUrl 格式不正确');
    }

    if (!relativePath.toLowerCase().endsWith('.md')) {
      throw new BadRequestException('技能文件必须是 .md 文件');
    }

    const targetPath = path.resolve(this.localFileRoot, relativePath);
    const relativeToRoot = path.relative(this.localFileRoot, targetPath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      throw new BadRequestException('fileUrl 不能超出本地文件根目录');
    }

    let fileContent: string;
    try {
      fileContent = (await fs.readFile(targetPath, 'utf8')).trim();
    } catch {
      throw new NotFoundException('未找到 fileUrl 对应的本地文件，请重新上传');
    }

    if (!fileContent) {
      throw new BadRequestException('Markdown 技能文件内容不能为空');
    }

    return {
      fileName: path.basename(targetPath),
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
      fileUrl: skill.fileUrl ?? null,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }
}
