import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AuditForumDynamicDto } from './dto/audit-forum-dynamic.dto';
import { CreateMyForumDynamicDto } from './dto/create-my-forum-dynamic.dto';
import { QueryMyForumDynamicDto } from './dto/query-my-forum-dynamic.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { UpdateMyForumDynamicDto } from './dto/update-my-forum-dynamic.dto';
import { UpdateForumDynamicStatusDto } from './dto/update-forum-dynamic-status.dto';
import { UpdateForumDynamicDto } from './dto/update-forum-dynamic.dto';
import { ForumDynamicType } from './entities/forum-dynamic-type.entity';
import { ForumDynamicFavorite } from './entities/forum-dynamic-favorite.entity';
import { ForumDynamicLike } from './entities/forum-dynamic-like.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumChangeLogsService } from './forum-change-logs.service';

/** 未指定动态类型时的兜底类型，对应 forum_dynamic_types 里的「其他」 */
const DEFAULT_DYNAMIC_TYPE_ID = 5;

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    @InjectRepository(ForumDynamicType)
    private readonly typesRepository: Repository<ForumDynamicType>,
    @InjectRepository(ForumDynamicLike)
    private readonly likesRepository: Repository<ForumDynamicLike>,
    @InjectRepository(ForumDynamicFavorite)
    private readonly favoritesRepository: Repository<ForumDynamicFavorite>,
    private readonly changeLogsService: ForumChangeLogsService,
  ) {}

  async findAll(queryForumDynamicDto: QueryForumDynamicDto, customerId?: string) {
    const { keyword, title, topic, typeId, pinned, auditStatus, enabled } = queryForumDynamicDto;
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
    if (title) {
      query.andWhere('dynamic.title LIKE :title', {
        title: `%${title.trim()}%`,
      });
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

    const interactionStates = await this.getInteractionStates(
      list.map((dynamic) => dynamic.id),
      customerId,
    );

    return createPaginationResult(
      list.map((dynamic) => this.toResponse(dynamic, interactionStates.get(dynamic.id))),
      total,
      page,
      size,
    );
  }

  async findMine(queryMyForumDynamicDto: QueryMyForumDynamicDto, customerId: string) {
    const { keyword, topic, typeId, pinned, status } = queryMyForumDynamicDto;
    const { page, size, skip } = resolvePagination(queryMyForumDynamicDto);
    const query = this.dynamicsRepository
      .createQueryBuilder('dynamic')
      .leftJoinAndSelect('dynamic.customer', 'customer')
      .leftJoinAndSelect('dynamic.type', 'type')
      .where('dynamic.customerId = :customerId', { customerId });

    if (keyword) {
      query.andWhere(
        '(dynamic.title LIKE :keyword OR dynamic.content LIKE :keyword OR dynamic.id LIKE :keyword)',
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
    if (status === 'published') {
      query.andWhere('dynamic.auditStatus = :auditStatus', { auditStatus: 'approved' });
      query.andWhere('dynamic.enabled = :enabled', { enabled: 1 });
    } else if (status === 'pending' || status === 'rejected') {
      query.andWhere('dynamic.auditStatus = :auditStatus', { auditStatus: status });
    }

    const [list, total] = await query
      .orderBy('dynamic.pinned', 'DESC')
      .addOrderBy('dynamic.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    const interactionStates = await this.getInteractionStates(
      list.map((dynamic) => dynamic.id),
      customerId,
    );

    return createPaginationResult(
      list.map((dynamic) => this.toResponse(dynamic, interactionStates.get(dynamic.id))),
      total,
      page,
      size,
    );
  }

  async findLiked(query: PaginationQueryDto, customerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const buildQuery = () =>
      this.likesRepository
        .createQueryBuilder('like')
        .innerJoin(ForumDynamic, 'dynamic', 'dynamic.id = like.dynamicId')
        .where('like.customerId = :customerId', { customerId })
        .andWhere('dynamic.auditStatus = :auditStatus', { auditStatus: 'approved' })
        .andWhere('dynamic.enabled = :enabled', { enabled: 1 });

    const total = await buildQuery().getCount();
    const likes = await buildQuery()
      .orderBy('like.createdAt', 'DESC')
      .addOrderBy('like.id', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();

    const dynamicIds = likes.map((like) => like.dynamicId);
    if (dynamicIds.length === 0) {
      return createPaginationResult([], total, page, size);
    }

    const dynamics = await this.dynamicsRepository.find({
      where: { id: In(dynamicIds) },
      relations: { customer: true, type: true },
    });
    const dynamicMap = new Map(dynamics.map((dynamic) => [dynamic.id, dynamic]));
    const interactionStates = await this.getInteractionStates(dynamicIds, customerId);

    const list = likes
      .map((like) => dynamicMap.get(like.dynamicId))
      .filter((dynamic): dynamic is ForumDynamic => dynamic !== undefined)
      .map((dynamic) => this.toResponse(dynamic, interactionStates.get(dynamic.id)));

    return createPaginationResult(list, total, page, size);
  }

  async findFavorited(query: PaginationQueryDto, customerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const buildQuery = () =>
      this.favoritesRepository
        .createQueryBuilder('favorite')
        .innerJoin(ForumDynamic, 'dynamic', 'dynamic.id = favorite.dynamicId')
        .where('favorite.customerId = :customerId', { customerId })
        .andWhere('dynamic.auditStatus = :auditStatus', { auditStatus: 'approved' })
        .andWhere('dynamic.enabled = :enabled', { enabled: 1 });

    const total = await buildQuery().getCount();
    const favorites = await buildQuery()
      .orderBy('favorite.createdAt', 'DESC')
      .addOrderBy('favorite.id', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();

    const dynamicIds = favorites.map((favorite) => favorite.dynamicId);
    if (dynamicIds.length === 0) {
      return createPaginationResult([], total, page, size);
    }

    const dynamics = await this.dynamicsRepository.find({
      where: { id: In(dynamicIds) },
      relations: { customer: true, type: true },
    });
    const dynamicMap = new Map(dynamics.map((dynamic) => [dynamic.id, dynamic]));
    const interactionStates = await this.getInteractionStates(dynamicIds, customerId);

    const list = favorites
      .map((favorite) => dynamicMap.get(favorite.dynamicId))
      .filter((dynamic): dynamic is ForumDynamic => dynamic !== undefined)
      .map((dynamic) => this.toResponse(dynamic, interactionStates.get(dynamic.id)));

    return createPaginationResult(list, total, page, size);
  }

  async findByCustomer(customerId: string, query: PaginationQueryDto, currentCustomerId?: string) {
    const { page, size, skip } = resolvePagination(query);
    const [list, total] = await this.dynamicsRepository.findAndCount({
      where: {
        customerId,
        auditStatus: 'approved',
        enabled: 1,
      },
      relations: { customer: true, type: true },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
    });

    const interactionStates = await this.getInteractionStates(
      list.map((dynamic) => dynamic.id),
      currentCustomerId,
    );

    return createPaginationResult(
      list.map((dynamic) => this.toResponse(dynamic, interactionStates.get(dynamic.id))),
      total,
      page,
      size,
    );
  }

  async findOne(id: string, customerId?: string) {
    const dynamic = await this.getDynamicOrThrow(id);
    const interactionStates = await this.getInteractionStates([id], customerId);
    return this.toResponse(dynamic, interactionStates.get(id));
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
    if (updateForumDynamicDto.title !== undefined) {
      dynamic.title = updateForumDynamicDto.title;
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

  async createMine(createMyForumDynamicDto: CreateMyForumDynamicDto, customerId: string) {
    const typeId = createMyForumDynamicDto.typeId ?? DEFAULT_DYNAMIC_TYPE_ID;
    const type = await this.typesRepository.findOneBy({ typeId: String(typeId) });
    if (!type) {
      throw new NotFoundException(`动态类型 ${typeId} 不存在`);
    }

    const media = createMyForumDynamicDto.media ?? [];
    if (media.length > 9) {
      throw new BadRequestException('最多只能上传 9 个素材');
    }

    // C 端新发布的动态一律进入待审批状态，审批通过后才对外可见
    const dynamic = this.dynamicsRepository.create({
      id: this.createDynamicId(),
      customerId,
      typeId: type.typeId,
      type,
      title: createMyForumDynamicDto.title.trim(),
      content: createMyForumDynamicDto.content,
      media,
      topic: createMyForumDynamicDto.topic?.trim() || type.typeName,
      favoriteCount: 0,
      auditStatus: 'pending',
      enabled: 0,
    });

    const saved = await this.dynamicsRepository.save(dynamic);

    await this.changeLogsService.recordChange({
      targetId: saved.id,
      ownerId: customerId,
      editorId: customerId,
      editorType: 'customer',
      action: 'create',
      remark: 'C 端用户发布动态',
    });

    return this.toResponse(await this.getDynamicOrThrow(saved.id));
  }

  async updateMine(
    id: string,
    updateMyForumDynamicDto: UpdateMyForumDynamicDto,
    customerId: string,
  ) {
    const dynamic = await this.getDynamicOrThrow(id);
    if (dynamic.customerId !== customerId) {
      throw new ForbiddenException('只能编辑自己的动态');
    }

    if (updateMyForumDynamicDto.title !== undefined) {
      dynamic.title = updateMyForumDynamicDto.title;
    }
    if (updateMyForumDynamicDto.content !== undefined) {
      dynamic.content = updateMyForumDynamicDto.content;
    }
    if (updateMyForumDynamicDto.media !== undefined) {
      dynamic.media = updateMyForumDynamicDto.media;
    }
    if (updateMyForumDynamicDto.typeId !== undefined) {
      const type = await this.typesRepository.findOneBy({
        typeId: String(updateMyForumDynamicDto.typeId),
      });
      if (!type) {
        throw new NotFoundException(`动态类型 ${updateMyForumDynamicDto.typeId} 不存在`);
      }

      dynamic.typeId = type.typeId;
      dynamic.type = type;
      dynamic.topic = type.typeName;
    }

    dynamic.auditStatus = 'pending';
    dynamic.enabled = 0;
    const saved = await this.dynamicsRepository.save(dynamic);

    await this.changeLogsService.recordChange({
      targetId: dynamic.id,
      ownerId: customerId,
      editorId: customerId,
      editorType: 'customer',
      action: 'edit',
      remark: updateMyForumDynamicDto.remark,
    });

    return this.toResponse(saved);
  }

  async removeMine(id: string, customerId: string) {
    const dynamic = await this.getDynamicOrThrow(id);
    if (dynamic.customerId !== customerId) {
      throw new ForbiddenException('只能删除自己的动态');
    }

    await this.dynamicsRepository.delete(id);
    return { success: true, id };
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

  private createDynamicId(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `D-${stamp}${random}`;
  }

  private toResponse(
    dynamic: ForumDynamic,
    interactionState: { liked: boolean; favorited: boolean } = {
      liked: false,
      favorited: false,
    },
  ) {
    return {
      id: dynamic.id,
      title: dynamic.title,
      content: dynamic.content,
      media: dynamic.media,
      typeId: dynamic.typeId ? Number(dynamic.typeId) : 0,
      typeName: dynamic.type?.typeName ?? '',
      author: {
        id: dynamic.customer.id,
        nickname: dynamic.customer.nickname,
        avatar: dynamic.customer.avatar ?? '',
        vipLevel: dynamic.customer.vipLevel,
      },
      topic: dynamic.topic,
      likeCount: dynamic.likeCount,
      commentCount: dynamic.commentCount,
      favoriteCount: dynamic.favoriteCount,
      shareCount: dynamic.shareCount,
      liked: interactionState.liked,
      favorited: interactionState.favorited,
      createdAt: dynamic.createdAt,
      pinned: dynamic.pinned === 1,
      auditStatus: dynamic.auditStatus,
      enabled: dynamic.enabled,
    };
  }

  private async getInteractionStates(dynamicIds: string[], customerId?: string) {
    const states = new Map(
      dynamicIds.map((dynamicId) => [dynamicId, { liked: false, favorited: false }]),
    );

    if (!customerId || dynamicIds.length === 0) {
      return states;
    }

    const [likes, favorites] = await Promise.all([
      this.likesRepository.find({
        where: { dynamicId: In(dynamicIds), customerId },
      }),
      this.favoritesRepository.find({
        where: { dynamicId: In(dynamicIds), customerId },
      }),
    ]);

    for (const like of likes) {
      states.get(like.dynamicId)!.liked = true;
    }
    for (const favorite of favorites) {
      states.get(favorite.dynamicId)!.favorited = true;
    }

    return states;
  }
}
