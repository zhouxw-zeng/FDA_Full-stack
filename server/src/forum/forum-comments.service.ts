import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CreateForumCommentDto } from './dto/create-forum-comment.dto';
import { QueryForumCommentDto } from './dto/query-forum-comment.dto';
import { ForumActivityNotification } from './entities/forum-activity-notification.entity';
import { ForumComment } from './entities/forum-comment.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumInteractionEvent } from './entities/forum-interaction-event.entity';
import { ForumNotificationsService } from './forum-notifications.service';

@Injectable()
export class ForumCommentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ForumComment)
    private readonly commentsRepository: Repository<ForumComment>,
    @InjectRepository(CustomerUser)
    private readonly customersRepository: Repository<CustomerUser>,
    private readonly notificationsService: ForumNotificationsService,
  ) {}

  async create(dto: CreateForumCommentDto, customerId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const notifications: ForumActivityNotification[] = [];
      const dynamic = await manager.findOneBy(ForumDynamic, { id: dto.dynamicId });
      if (!dynamic) {
        throw new NotFoundException(`动态 ${dto.dynamicId} 不存在`);
      }

      let parent: ForumComment | null = null;
      if (dto.parentId) {
        parent = await manager.findOneBy(ForumComment, { id: dto.parentId });
        if (!parent || parent.dynamicId !== dto.dynamicId || parent.deletedAt) {
          throw new NotFoundException(`评论 ${dto.parentId} 不存在`);
        }
      }

      const rootId = parent ? (parent.rootId ?? parent.id) : null;
      if (rootId) {
        const root = await manager.findOneBy(ForumComment, { id: rootId });
        if (!root || root.deletedAt) {
          throw new NotFoundException(`评论 ${rootId} 不存在`);
        }
      }

      const comment = await manager.save(
        manager.create(ForumComment, {
          dynamicId: dto.dynamicId,
          rootId,
          parentId: parent?.id ?? null,
          customerId,
          replyToCustomerId: parent?.customerId ?? null,
          content: dto.content.trim(),
          auditStatus: 'approved',
          likeCount: 0,
          replyCount: 0,
          deletedAt: null,
        }),
      );

      await manager.increment(ForumDynamic, { id: dto.dynamicId }, 'commentCount', 1);
      if (rootId) {
        await manager.increment(ForumComment, { id: rootId }, 'replyCount', 1);
      }

      await manager.save(
        manager.create(ForumInteractionEvent, {
          dynamicId: dto.dynamicId,
          customerId,
          action: 'comment',
          targetId: comment.id,
          requestId: dto.requestId ?? null,
          metadata: { parentId: parent?.id ?? null },
        }),
      );

      const dynamicNotification = await this.createNotification(manager, {
        recipientId: dynamic.customerId,
        actorId: customerId,
        type: 'dynamic_comment',
        dynamicId: dto.dynamicId,
        targetId: comment.id,
      });
      if (dynamicNotification) {
        notifications.push(dynamicNotification);
      }

      if (parent) {
        const replyNotification = await this.createNotification(manager, {
          recipientId: parent.customerId,
          actorId: customerId,
          type: 'comment_reply',
          dynamicId: dto.dynamicId,
          targetId: comment.id,
        });
        if (replyNotification) {
          notifications.push(replyNotification);
        }
      }

      return {
        response: this.toResponse(comment, await this.getAuthor(customerId), customerId),
        notifications,
      };
    });

    for (const notification of result.notifications) {
      await this.notificationsService.push(notification);
    }

    return result.response;
  }

  async findTopLevel(dynamicId: string, query: QueryForumCommentDto, customerId?: string) {
    const { page, size, skip } = resolvePagination(query);
    const sort = query.sort ?? 'likes';
    const order =
      sort === 'replies'
        ? {
            replyCount: 'DESC' as const,
            createdAt: 'DESC' as const,
            id: 'DESC' as const,
          }
        : sort === 'likes'
          ? {
              likeCount: 'DESC' as const,
              createdAt: 'DESC' as const,
              id: 'DESC' as const,
            }
          : { createdAt: 'DESC' as const, id: 'DESC' as const };
    const [list, total] = await this.commentsRepository.findAndCount({
      where: { dynamicId, rootId: IsNull(), deletedAt: IsNull() },
      order,
      skip,
      take: size,
    });

    return createPaginationResult(await this.withAuthors(list, customerId), total, page, size);
  }

  async findReplies(rootId: string, query: QueryForumCommentDto, customerId?: string) {
    const { page, size, skip } = resolvePagination(query);
    const root = await this.commentsRepository.findOneBy({
      id: rootId,
      deletedAt: IsNull(),
    });
    if (!root) {
      return createPaginationResult([], 0, page, size);
    }

    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.rootId = :rootId', { rootId })
      .andWhere('comment.id != :rootId', { rootId })
      .andWhere('comment.deletedAt IS NULL');
    const [list, total] = await queryBuilder
      .orderBy('comment.createdAt', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(await this.withAuthors(list, customerId), total, page, size);
  }

  async remove(commentId: string, customerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const comment = await manager.findOneBy(ForumComment, { id: commentId });
      if (!comment) {
        throw new NotFoundException(`评论 ${commentId} 不存在`);
      }
      if (comment.customerId !== customerId) {
        throw new ForbiddenException('只能删除自己发表的评论');
      }
      if (comment.deletedAt) {
        return { success: true, id: commentId };
      }

      const deletedAt = new Date();
      let deletedCount = 1;

      if (!comment.rootId) {
        const replies = await manager.find(ForumComment, {
          where: { rootId: comment.id, deletedAt: IsNull() },
        });
        deletedCount += replies.length;

        if (replies.length > 0) {
          await manager
            .createQueryBuilder()
            .update(ForumComment)
            .set({ deletedAt })
            .where('root_id = :rootId', { rootId: comment.id })
            .andWhere('deleted_at IS NULL')
            .execute();
        }

        comment.replyCount = 0;
      }

      comment.deletedAt = deletedAt;
      await manager.save(comment);
      await manager
        .createQueryBuilder()
        .update(ForumDynamic)
        .set({ commentCount: () => `GREATEST(comment_count - ${deletedCount}, 0)` })
        .where('id = :dynamicId', { dynamicId: comment.dynamicId })
        .execute();

      if (comment.rootId) {
        await manager
          .createQueryBuilder()
          .update(ForumComment)
          .set({ replyCount: () => 'GREATEST(reply_count - 1, 0)' })
          .where('id = :rootId', { rootId: comment.rootId })
          .execute();
      }

      await manager.save(
        manager.create(ForumInteractionEvent, {
          dynamicId: comment.dynamicId,
          customerId,
          action: 'delete_comment',
          targetId: comment.id,
          requestId: null,
          metadata: { deletedCount },
        }),
      );

      return { success: true, id: commentId, deletedCount };
    });
  }

  private async withAuthors(comments: ForumComment[], customerId?: string) {
    const authorIds = [...new Set(comments.map((comment) => comment.customerId))];
    const authors = authorIds.length
      ? await this.customersRepository.findBy({ id: In(authorIds) })
      : [];
    const authorMap = new Map(authors.map((author) => [author.id, author]));

    return comments.map((comment) =>
      this.toResponse(comment, authorMap.get(comment.customerId), customerId),
    );
  }

  private async getAuthor(customerId: string): Promise<CustomerUser | undefined> {
    return (await this.customersRepository.findOneBy({ id: customerId })) ?? undefined;
  }

  private toResponse(comment: ForumComment, author?: CustomerUser, currentCustomerId?: string) {
    return {
      id: comment.id,
      dynamicId: comment.dynamicId,
      rootId: comment.rootId,
      parentId: comment.parentId,
      content: comment.deletedAt ? null : comment.content,
      deleted: Boolean(comment.deletedAt),
      author: author
        ? {
            id: author.id,
            nickname: author.nickname,
            avatar: author.avatar,
            vipLevel: author.vipLevel,
          }
        : null,
      replyToCustomerId: comment.replyToCustomerId,
      replyCount: comment.replyCount,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      isOwn: currentCustomerId === comment.customerId,
    };
  }

  private async createNotification(
    manager: DataSource['manager'],
    input: {
      recipientId: string;
      actorId: string;
      type: 'dynamic_comment' | 'comment_reply';
      dynamicId: string;
      targetId: string;
    },
  ): Promise<ForumActivityNotification | null> {
    if (input.recipientId === input.actorId) {
      return null;
    }

    await manager
      .createQueryBuilder()
      .insert()
      .into(ForumActivityNotification)
      .values({ ...input, isRead: 0, withdrawnAt: null })
      .orIgnore()
      .execute();

    return manager.findOneBy(ForumActivityNotification, {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      dynamicId: input.dynamicId,
      targetId: input.targetId,
    });
  }
}
