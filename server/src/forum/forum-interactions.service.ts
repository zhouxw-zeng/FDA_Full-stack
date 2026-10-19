import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ForumFavoriteDto } from './dto/forum-favorite.dto';
import { ForumInteractionDto } from './dto/forum-interaction.dto';
import { ShareForumDynamicDto } from './dto/share-forum-dynamic.dto';
import { ForumActivityNotification } from './entities/forum-activity-notification.entity';
import { ForumDynamicFavorite } from './entities/forum-dynamic-favorite.entity';
import { ForumDynamicLike } from './entities/forum-dynamic-like.entity';
import { ForumDynamicShareEvent } from './entities/forum-dynamic-share-event.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumInteractionEvent } from './entities/forum-interaction-event.entity';
import { ForumNotificationsService } from './forum-notifications.service';

@Injectable()
export class ForumInteractionsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    @InjectRepository(ForumDynamicLike)
    private readonly likesRepository: Repository<ForumDynamicLike>,
    @InjectRepository(ForumDynamicFavorite)
    private readonly favoritesRepository: Repository<ForumDynamicFavorite>,
    private readonly notificationsService: ForumNotificationsService,
  ) {}

  async toggleLike(dto: ForumInteractionDto, customerId: string) {
    const notification = await this.dataSource.transaction(async (manager) => {
      let notificationToPush: ForumActivityNotification | null = null;
      const dynamic = await this.getDynamicOrThrow(manager, dto.dynamicId);

      if (dto.action === 'like') {
        const result = await manager
          .createQueryBuilder()
          .insert()
          .into(ForumDynamicLike)
          .values({ dynamicId: dto.dynamicId, customerId })
          .orIgnore()
          .execute();

        if (this.affectedRows(result.raw) > 0) {
          await manager.increment(ForumDynamic, { id: dto.dynamicId }, 'likeCount', 1);
        }
        const notificationResult = await this.upsertNotification(manager, {
          recipientId: dynamic.customerId,
          actorId: customerId,
          type: 'dynamic_like',
          dynamicId: dto.dynamicId,
          targetId: dto.dynamicId,
        });
        if (notificationResult?.shouldPush) {
          notificationToPush = notificationResult.notification;
        }
      } else {
        const result = await manager.delete(ForumDynamicLike, {
          dynamicId: dto.dynamicId,
          customerId,
        });

        if (result.affected) {
          await manager
            .createQueryBuilder()
            .update(ForumDynamic)
            .set({ likeCount: () => 'GREATEST(like_count - 1, 0)' })
            .where('id = :dynamicId', { dynamicId: dto.dynamicId })
            .execute();
          await manager.update(
            ForumActivityNotification,
            {
              recipientId: dynamic.customerId,
              actorId: customerId,
              type: 'dynamic_like',
              dynamicId: dto.dynamicId,
            },
            { withdrawnAt: new Date() },
          );
        }
      }

      await this.recordEvent(manager, {
        dynamicId: dto.dynamicId,
        customerId,
        action: dto.action,
        requestId: dto.requestId,
      });

      return notificationToPush;
    });

    if (notification) {
      await this.notificationsService.push(notification);
    }

    return this.getInteractionInfo(dto.dynamicId, customerId);
  }

  async toggleFavorite(dto: ForumFavoriteDto, customerId: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.getDynamicOrThrow(manager, dto.dynamicId);

      if (dto.action === 'favorite') {
        const result = await manager
          .createQueryBuilder()
          .insert()
          .into(ForumDynamicFavorite)
          .values({ dynamicId: dto.dynamicId, customerId })
          .orIgnore()
          .execute();

        if (this.affectedRows(result.raw) > 0) {
          await manager.increment(ForumDynamic, { id: dto.dynamicId }, 'favoriteCount', 1);
        }
      } else {
        const result = await manager.delete(ForumDynamicFavorite, {
          dynamicId: dto.dynamicId,
          customerId,
        });

        if (result.affected) {
          await manager
            .createQueryBuilder()
            .update(ForumDynamic)
            .set({ favoriteCount: () => 'GREATEST(favorite_count - 1, 0)' })
            .where('id = :dynamicId', { dynamicId: dto.dynamicId })
            .execute();
        }
      }

      await this.recordEvent(manager, {
        dynamicId: dto.dynamicId,
        customerId,
        action: dto.action,
        requestId: dto.requestId,
      });
    });

    return this.getInteractionInfo(dto.dynamicId, customerId);
  }

  async share(dto: ShareForumDynamicDto, customerId: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.getDynamicOrThrow(manager, dto.dynamicId);

      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(ForumDynamicShareEvent)
        .values({
          dynamicId: dto.dynamicId,
          customerId,
          channel: dto.channel ?? null,
          requestId: dto.requestId ?? null,
        })
        .orIgnore()
        .execute();

      if (this.affectedRows(result.raw) > 0) {
        await manager.increment(ForumDynamic, { id: dto.dynamicId }, 'shareCount', 1);
        await this.recordEvent(manager, {
          dynamicId: dto.dynamicId,
          customerId,
          action: 'share',
          requestId: dto.requestId,
          metadata: { channel: dto.channel ?? null },
        });
      }
    });

    return this.getInteractionInfo(dto.dynamicId, customerId);
  }

  async getInteractionInfo(dynamicId: string, customerId?: string) {
    const dynamic = await this.dynamicsRepository.findOneBy({ id: dynamicId });
    if (!dynamic) {
      throw new NotFoundException(`动态 ${dynamicId} 不存在`);
    }

    const [liked, favorited] = customerId
      ? await Promise.all([
          this.likesRepository.existsBy({ dynamicId, customerId }),
          this.favoritesRepository.existsBy({ dynamicId, customerId }),
        ])
      : [false, false];

    return {
      dynamicId,
      liked,
      favorited,
      likeCount: dynamic.likeCount,
      commentCount: dynamic.commentCount,
      favoriteCount: dynamic.favoriteCount,
      shareCount: dynamic.shareCount,
    };
  }

  private async getDynamicOrThrow(manager: DataSource['manager'], dynamicId: string) {
    const dynamic = await manager.findOneBy(ForumDynamic, { id: dynamicId });
    if (!dynamic) {
      throw new NotFoundException(`动态 ${dynamicId} 不存在`);
    }
    return dynamic;
  }

  private async recordEvent(
    manager: DataSource['manager'],
    input: {
      dynamicId: string;
      customerId: string;
      action:
        'like' | 'unlike' | 'favorite' | 'unfavorite' | 'share' | 'comment' | 'delete_comment';
      targetId?: string | null;
      requestId?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    await manager.save(
      manager.create(ForumInteractionEvent, {
        dynamicId: input.dynamicId,
        customerId: input.customerId,
        action: input.action,
        targetId: input.targetId ?? null,
        requestId: input.requestId ?? null,
        metadata: input.metadata ?? null,
      }),
    );
  }

  private async upsertNotification(
    manager: DataSource['manager'],
    input: {
      recipientId: string;
      actorId: string;
      type: 'dynamic_like' | 'dynamic_comment' | 'comment_reply';
      dynamicId: string;
      targetId: string;
    },
  ): Promise<{
    notification: ForumActivityNotification;
    shouldPush: boolean;
  } | null> {
    if (input.recipientId === input.actorId) {
      return null;
    }

    const insertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(ForumActivityNotification)
      .values({ ...input, isRead: 0, withdrawnAt: null })
      .orIgnore()
      .execute();

    const notification = await manager.findOneBy(ForumActivityNotification, {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      dynamicId: input.dynamicId,
      targetId: input.targetId,
    });
    if (!notification) {
      return null;
    }

    if (this.affectedRows(insertResult.raw) > 0) {
      return { notification, shouldPush: true };
    }

    if (notification.withdrawnAt) {
      notification.withdrawnAt = null;
      notification.isRead = 0;
      await manager.save(notification);
      return { notification, shouldPush: true };
    }

    return { notification, shouldPush: false };
  }

  private affectedRows(raw: unknown): number {
    if (typeof raw === 'object' && raw !== null && 'affectedRows' in raw) {
      return Number((raw as { affectedRows?: number }).affectedRows ?? 0);
    }
    return 0;
  }
}
