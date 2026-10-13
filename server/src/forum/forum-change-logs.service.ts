import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateForumChangeLogDto } from './dto/create-forum-change-log.dto';
import { QueryForumChangeLogDto } from './dto/query-forum-change-log.dto';
import { ForumChangeLog, ForumEditorType } from './entities/forum-change-log.entity';

export interface RecordForumChangeInput {
  targetId: string;
  ownerId: string;
  editorId: string;
  editorType: ForumEditorType;
  action: string;
  remark?: string;
  attachments?: string;
}

@Injectable()
export class ForumChangeLogsService {
  constructor(
    @InjectRepository(ForumChangeLog)
    private readonly logsRepository: Repository<ForumChangeLog>,
  ) {}

  async create(createForumChangeLogDto: CreateForumChangeLogDto) {
    return this.recordChange(createForumChangeLogDto);
  }

  async recordChange(input: RecordForumChangeInput) {
    const log = this.logsRepository.create({
      targetType: 'forum_dynamic',
      targetId: input.targetId,
      ownerId: input.ownerId,
      editorId: input.editorId,
      editorType: input.editorType,
      action: input.action,
      remark: input.remark ?? null,
      attachments: input.attachments ?? null,
    });

    return this.toResponse(await this.logsRepository.save(log));
  }

  async findAll(queryForumChangeLogDto: QueryForumChangeLogDto) {
    const { targetId, ownerId, editorType, action, keyword } = queryForumChangeLogDto;
    const { page, size, skip } = resolvePagination(queryForumChangeLogDto);
    const query = this.logsRepository.createQueryBuilder('log');

    if (targetId) {
      query.andWhere('log.targetId = :targetId', { targetId });
    }
    if (ownerId) {
      query.andWhere('log.ownerId = :ownerId', { ownerId });
    }
    if (editorType) {
      query.andWhere('log.editorType = :editorType', { editorType });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }
    if (keyword) {
      query.andWhere('(log.remark LIKE :keyword OR log.attachments LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await query
      .orderBy('log.changedAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((log) => this.toResponse(log)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    const log = await this.logsRepository.findOneBy({ id });

    if (!log) {
      throw new NotFoundException(`变更记录 ${id} 不存在`);
    }

    return this.toResponse(log);
  }

  private toResponse(log: ForumChangeLog) {
    return {
      id: log.id,
      targetType: log.targetType,
      targetId: log.targetId,
      ownerId: log.ownerId,
      editorId: log.editorId,
      editorType: log.editorType,
      action: log.action,
      changedAt: log.changedAt,
      remark: log.remark,
      attachments: log.attachments,
    };
  }
}
