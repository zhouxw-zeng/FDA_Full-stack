import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { ForumActivityNotification } from './entities/forum-activity-notification.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumNotificationsGateway } from './forum-notifications.gateway';

@Injectable()
export class ForumNotificationsService {
  private readonly logger = new Logger(ForumNotificationsService.name);

  constructor(
    @InjectRepository(ForumActivityNotification)
    private readonly notificationsRepository: Repository<ForumActivityNotification>,
    @InjectRepository(CustomerUser)
    private readonly customersRepository: Repository<CustomerUser>,
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    private readonly notificationsGateway: ForumNotificationsGateway,
  ) {}

  async findAll(query: PaginationQueryDto, customerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: {
        recipientId: customerId,
        withdrawnAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      skip,
      take: size,
    });

    return createPaginationResult(await this.toResponses(notifications), total, page, size);
  }

  async unreadCount(customerId: string) {
    const count = await this.notificationsRepository.count({
      where: {
        recipientId: customerId,
        isRead: 0,
        withdrawnAt: IsNull(),
      },
    });

    return { count };
  }

  async markRead(notificationId: string, customerId: string) {
    const notification = await this.notificationsRepository.findOneBy({
      id: notificationId,
      recipientId: customerId,
      withdrawnAt: IsNull(),
    });
    if (!notification) {
      throw new NotFoundException(`消息 ${notificationId} 不存在`);
    }

    if (notification.isRead !== 1) {
      notification.isRead = 1;
      await this.notificationsRepository.save(notification);
    }

    return { success: true, id: notificationId };
  }

  async markAllRead(customerId: string) {
    const result = await this.notificationsRepository.update(
      {
        recipientId: customerId,
        isRead: 0,
        withdrawnAt: IsNull(),
      },
      { isRead: 1 },
    );

    return { success: true, updatedCount: result.affected ?? 0 };
  }

  async remove(notificationId: string, customerId: string) {
    const notification = await this.notificationsRepository.findOneBy({
      id: notificationId,
      recipientId: customerId,
    });
    if (!notification) {
      throw new NotFoundException(`消息 ${notificationId} 不存在`);
    }

    await this.notificationsRepository.delete(notification.id);
    return { success: true, id: notificationId };
  }

  async clear(customerId: string) {
    const result = await this.notificationsRepository.delete({ recipientId: customerId });
    return { success: true, deletedCount: result.affected ?? 0 };
  }

  async push(notification: ForumActivityNotification): Promise<void> {
    try {
      const [payload] = await this.toResponses([notification]);
      const { count } = await this.unreadCount(notification.recipientId);
      this.notificationsGateway.emitNewNotification(notification.recipientId, payload, count);
    } catch (error) {
      this.logger.warn(
        `Forum notification push failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async toResponses(notifications: ForumActivityNotification[]) {
    const actorIds = [...new Set(notifications.map((notification) => notification.actorId))];
    const dynamicIds = [...new Set(notifications.map((notification) => notification.dynamicId))];
    const [actors, dynamics] = await Promise.all([
      actorIds.length ? this.customersRepository.findBy({ id: In(actorIds) }) : [],
      dynamicIds.length ? this.dynamicsRepository.findBy({ id: In(dynamicIds) }) : [],
    ]);
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
    const dynamicMap = new Map(dynamics.map((dynamic) => [dynamic.id, dynamic]));

    return notifications.map((notification) => {
      const actor = actorMap.get(notification.actorId);
      const dynamic = dynamicMap.get(notification.dynamicId);

      return {
        id: notification.id,
        type: notification.type,
        dynamicId: notification.dynamicId,
        targetId: notification.targetId,
        isRead: notification.isRead === 1,
        createdAt: notification.createdAt,
        actor: actor
          ? {
              id: actor.id,
              nickname: actor.nickname,
              avatar: actor.avatar,
            }
          : null,
        dynamic: dynamic
          ? {
              id: dynamic.id,
              title: dynamic.title,
              content: dynamic.content.slice(0, 120),
              topic: dynamic.topic,
            }
          : null,
        message: this.buildMessage(notification.type, actor?.nickname),
      };
    });
  }

  private buildMessage(type: ForumActivityNotification['type'], nickname?: string): string {
    const actorName = nickname || '用户';
    if (type === 'dynamic_like') {
      return `${actorName} 点赞了你的动态`;
    }
    if (type === 'dynamic_comment') {
      return `${actorName} 评论了你的动态`;
    }
    return `${actorName} 回复了你的评论`;
  }
}
