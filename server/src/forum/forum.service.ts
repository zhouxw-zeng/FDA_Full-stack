import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { AuditForumDynamicDto } from './dto/audit-forum-dynamic.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { UpdateForumDynamicStatusDto } from './dto/update-forum-dynamic-status.dto';
import { UpdateForumDynamicDto } from './dto/update-forum-dynamic.dto';
import { ForumDynamicType } from './entities/forum-dynamic-type.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumChangeLogsService } from './forum-change-logs.service';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    @InjectRepository(ForumDynamicType)
    private readonly typesRepository: Repository<ForumDynamicType>,
    private readonly changeLogsService: ForumChangeLogsService,
  ) {}

  async findAll(queryForumDynamicDto: QueryForumDynamicDto) {
    const { keyword, topic, typeId, pinned, auditStatus, enabled } = queryForumDynamicDto;
    const { page, size, skip } = resolvePagination(queryForumDynamicDto);
    const query = this.dynamicsRepository
      .createQueryBuilder('dynamic')
      .leftJoinAndSelect('dynamic.customer', 'customer')
      .leftJoinAndSelect('dynamic.type', 'type');

    if (keyword) {
      query.andWhere(
        '(dynamic.content LIKE :keyword OR dynamic.id LIKE :keyword OR customer.nickname LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (topic) {
      query.andWhere('dynamic.topic = :topic', { topic });
    }
    if (typeId !== undefined) {
      query.andWhere('dynamic.typeId = :typeId', { typeId: String(typeId) });
    }
    if (pinned !== undefined) {
      query.andWhere('dynamic.pinned = :pinned', { pinned: pinned ? 1 : 0 });
    }
    if (auditStatus) {
      query.andWhere('dynamic.auditStatus = :auditStatus', { auditStatus });
    }
    if (enabled !== undefined) {
      query.andWhere('dynamic.enabled = :enabled', { enabled });
    }

    const [list, total] = await query
      .orderBy('dynamic.pinned', 'DESC')
      .addOrderBy('dynamic.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((dynamic) => this.toResponse(dynamic)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getDynamicOrThrow(id));
  }

  async remove(id: string) {
    await this.getDynamicOrThrow(id);
    await this.dynamicsRepository.delete(id);
    return { success: true, id };
  }

  async audit(auditForumDynamicDto: AuditForumDynamicDto, adminId: string) {
    const dynamic = await this.getDynamicOrThrow(auditForumDynamicDto.id);

    dynamic.auditStatus = auditForumDynamicDto.status;
    dynamic.enabled = auditForumDynamicDto.status === 'approved' ? 1 : 0;

    const saved = await this.dynamicsRepository.save(dynamic);
    await this.changeLogsService.recordChange({
      targetId: dynamic.id,
      ownerId: dynamic.customerId,
      editorId: adminId,
      editorType: 'admin',
      action: 'audit',
      remark: auditForumDynamicDto.remark,
      attachments: auditForumDynamicDto.attachments,
    });

    return this.toResponse(saved);
  }

  async updateStatus(updateForumDynamicStatusDto: UpdateForumDynamicStatusDto, adminId: string) {
    const dynamic = await this.getDynamicOrThrow(updateForumDynamicStatusDto.id);

    if (updateForumDynamicStatusDto.enabled === 1 && dynamic.auditStatus !== 'approved') {
      throw new ConflictException('只有审批通过的动态才能启用');
    }

    dynamic.enabled = updateForumDynamicStatusDto.enabled;
    const saved = await this.dynamicsRepository.save(dynamic);
    await this.changeLogsService.recordChange({
      targetId: dynamic.id,
      ownerId: dynamic.customerId,
      editorId: adminId,
      editorType: 'admin',
      action: updateForumDynamicStatusDto.enabled === 1 ? 'enable' : 'offline',
      remark: updateForumDynamicStatusDto.remark,
      attachments: updateForumDynamicStatusDto.attachments,
    });

    return this.toResponse(saved);
  }

  async update(updateForumDynamicDto: UpdateForumDynamicDto, adminId: string) {
    const dynamic = await this.getDynamicOrThrow(updateForumDynamicDto.id);
    const editorId =
      updateForumDynamicDto.editorType === 'admin' ? adminId : updateForumDynamicDto.editorId;

    if (!editorId) {
      throw new BadRequestException('C 端用户编辑时必须传入 editorId');
    }

    if (updateForumDynamicDto.content !== undefined) {
      dynamic.content = updateForumDynamicDto.content;
    }
    if (updateForumDynamicDto.media !== undefined) {
      dynamic.media = updateForumDynamicDto.media;
    }
    if (updateForumDynamicDto.typeId !== undefined) {
      const type = await this.typesRepository.findOneBy({
        typeId: String(updateForumDynamicDto.typeId),
      });

      if (!type) {
        throw new NotFoundException(`动态类型 ${updateForumDynamicDto.typeId} 不存在`);
      }

      dynamic.typeId = type.typeId;
      dynamic.type = type;
      dynamic.topic = type.typeName;
    }

    const saved = await this.dynamicsRepository.save(dynamic);
    await this.changeLogsService.recordChange({
      targetId: dynamic.id,
      ownerId: dynamic.customerId,
      editorId,
      editorType: updateForumDynamicDto.editorType,
      action: 'edit',
      remark: updateForumDynamicDto.remark,
      attachments: updateForumDynamicDto.attachments,
    });

    return this.toResponse(saved);
  }

  async findPreviewMedia() {
    const dynamics = await this.dynamicsRepository.find({
      order: {
        pinned: 'DESC',
        createdAt: 'DESC',
      },
      take: 24,
    });

    return dynamics.flatMap((dynamic) => dynamic.media).slice(0, 24);
  }

  private async getDynamicOrThrow(id: string): Promise<ForumDynamic> {
    const dynamic = await this.dynamicsRepository.findOne({
      where: { id },
      relations: { customer: true, type: true },
    });

    if (!dynamic) {
      throw new NotFoundException(`动态 ${id} 不存在`);
    }

    return dynamic;
  }

  private toResponse(dynamic: ForumDynamic) {
    return {
      id: dynamic.id,
      content: dynamic.content,
      media: dynamic.media,
      typeId: Number(dynamic.typeId),
      typeName: dynamic.type.typeName,
      author: {
        id: dynamic.customer.id,
        nickname: dynamic.customer.nickname,
        avatar: dynamic.customer.avatar ?? '',
      },
      topic: dynamic.topic,
      likeCount: dynamic.likeCount,
      commentCount: dynamic.commentCount,
      shareCount: dynamic.shareCount,
      createdAt: dynamic.createdAt,
      pinned: dynamic.pinned === 1,
      auditStatus: dynamic.auditStatus,
      enabled: dynamic.enabled,
    };
  }
}
