import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { ForumDynamic } from '../forum/entities/forum-dynamic.entity';
import { ForumNotificationsService } from '../forum/forum-notifications.service';
import { CustomerImGateway } from './customer-im.gateway';
import { FollowCustomerDto } from './dto/follow-customer.dto';
import { QuerySocialUserDto } from './dto/query-social-user.dto';
import { SendCustomerMessageDto } from './dto/send-customer-message.dto';
import { CustomerFollow } from './entities/customer-follow.entity';
import { CustomerMessage } from './entities/customer-message.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(CustomerUser)
    private readonly customersRepository: Repository<CustomerUser>,
    @InjectRepository(CustomerFollow)
    private readonly followsRepository: Repository<CustomerFollow>,
    @InjectRepository(CustomerMessage)
    private readonly messagesRepository: Repository<CustomerMessage>,
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    private readonly customerImGateway: CustomerImGateway,
    private readonly forumNotificationsService: ForumNotificationsService,
  ) {}

  async findUsers(query: QuerySocialUserDto, currentCustomerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const builder = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.id != :currentCustomerId', { currentCustomerId })
      .andWhere('customer.auditStatus = :auditStatus', { auditStatus: 'approved' })
      .andWhere('customer.enabled = :enabled', { enabled: 1 });

    if (query.keyword?.trim()) {
      builder.andWhere('customer.nickname LIKE :keyword', {
        keyword: `%${query.keyword.trim()}%`,
      });
    }

    const [customers, total] = await builder
      .orderBy('customer.updatedAt', 'DESC')
      .addOrderBy('customer.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    const list = await this.toUserResponses(customers, currentCustomerId);
    return createPaginationResult(list, total, page, size);
  }

  async findFriends(query: PaginationQueryDto, currentCustomerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const [customers, total] = await this.customersRepository
      .createQueryBuilder('customer')
      .innerJoin(
        CustomerFollow,
        'outgoing',
        'outgoing.followingId = customer.id AND outgoing.followerId = :currentCustomerId',
        { currentCustomerId },
      )
      .innerJoin(
        CustomerFollow,
        'incoming',
        'incoming.followerId = customer.id AND incoming.followingId = :currentCustomerId',
      )
      .where('customer.auditStatus = :auditStatus', { auditStatus: 'approved' })
      .andWhere('customer.enabled = :enabled', { enabled: 1 })
      .orderBy('customer.updatedAt', 'DESC')
      .addOrderBy('customer.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      customers.map((customer) => ({
        ...this.toCustomerCard(customer),
        isFollowing: true,
        isFollowedBy: true,
        isMutual: true,
        canChat: true,
        canLeaveMessage: true,
      })),
      total,
      page,
      size,
    );
  }

  async findUser(userId: string, currentCustomerId: string) {
    const customer = await this.getCustomerOrThrow(userId);
    const [user] = await this.toUserResponses([customer], currentCustomerId);
    return user;
  }

  async getStats(currentCustomerId: string) {
    const [following, followers, dynamics] = await Promise.all([
      this.followsRepository.count({ where: { followerId: currentCustomerId } }),
      this.followsRepository.count({ where: { followingId: currentCustomerId } }),
      this.dynamicsRepository.count({ where: { customerId: currentCustomerId } }),
    ]);

    return { following, followers, dynamics };
  }

  async follow(dto: FollowCustomerDto, currentCustomerId: string) {
    if (dto.targetUserId === currentCustomerId) {
      throw new ConflictException('不能关注自己');
    }

    await this.getCustomerOrThrow(dto.targetUserId);
    const alreadyFollowing = await this.isFollowing(currentCustomerId, dto.targetUserId);
    await this.followsRepository
      .createQueryBuilder()
      .insert()
      .into(CustomerFollow)
      .values({
        followerId: currentCustomerId,
        followingId: dto.targetUserId,
      })
      .orIgnore()
      .execute();

    if (!alreadyFollowing) {
      await this.forumNotificationsService.notifyFollow(dto.targetUserId, currentCustomerId);
    }

    const [isFollowedBy, isMutual] = await Promise.all([
      this.isFollowing(dto.targetUserId, currentCustomerId),
      this.isMutual(currentCustomerId, dto.targetUserId),
    ]);

    return {
      success: true,
      targetUserId: dto.targetUserId,
      isFollowing: true,
      isFollowedBy,
      isMutual,
      canChat: isMutual,
    };
  }

  async unfollow(targetUserId: string, currentCustomerId: string) {
    await this.getCustomerOrThrow(targetUserId);
    const result = await this.followsRepository.delete({
      followerId: currentCustomerId,
      followingId: targetUserId,
    });

    if (result.affected) {
      await this.forumNotificationsService.withdrawFollow(targetUserId, currentCustomerId);
    }

    return {
      success: true,
      targetUserId,
      isFollowing: false,
      isFollowedBy: await this.isFollowing(targetUserId, currentCustomerId),
      isMutual: false,
      canChat: false,
    };
  }

  async sendMessage(dto: SendCustomerMessageDto, currentCustomerId: string) {
    if (dto.recipientId === currentCustomerId) {
      throw new ConflictException('不能给自己发送消息');
    }
    await this.getCustomerOrThrow(dto.recipientId);

    if (dto.requestId) {
      const existing = await this.messagesRepository.findOneBy({
        requestId: dto.requestId,
      });
      if (existing) {
        if (existing.senderId !== currentCustomerId || existing.recipientId !== dto.recipientId) {
          throw new ConflictException('请求 ID 已被其他消息使用');
        }
        return this.toMessageResponse(existing, await this.getCustomerOrThrow(currentCustomerId));
      }
    }

    const isMutual = await this.isMutual(currentCustomerId, dto.recipientId);
    if (!isMutual) {
      const guestbookCount = await this.messagesRepository.count({
        where: {
          senderId: currentCustomerId,
          recipientId: dto.recipientId,
          deliveryMode: 'guestbook',
        },
      });
      if (guestbookCount >= 1) {
        throw new ConflictException('未互相关注前只能留言一条');
      }
    }

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        senderId: currentCustomerId,
        recipientId: dto.recipientId,
        content: dto.content.trim(),
        deliveryMode: isMutual ? 'chat' : 'guestbook',
        requestId: dto.requestId ?? null,
        isRead: 0,
        readAt: null,
      }),
    );
    const response = this.toMessageResponse(
      message,
      await this.getCustomerOrThrow(currentCustomerId),
    );
    this.customerImGateway.emitMessage(dto.recipientId, response);

    return {
      ...response,
      isMutual,
    };
  }

  async findMessages(targetUserId: string, query: PaginationQueryDto, currentCustomerId: string) {
    await this.getCustomerOrThrow(targetUserId);
    const { page, size, skip } = resolvePagination(query);
    const builder = this.messagesRepository
      .createQueryBuilder('message')
      .where(
        '((message.senderId = :currentCustomerId AND message.recipientId = :targetUserId) OR (message.senderId = :targetUserId AND message.recipientId = :currentCustomerId))',
        { currentCustomerId, targetUserId },
      );

    const total = await builder.clone().getCount();
    const messages = await builder
      .clone()
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .skip(skip)
      .take(size)
      .getMany();
    messages.reverse();

    const now = new Date();
    await this.messagesRepository
      .createQueryBuilder()
      .update(CustomerMessage)
      .set({ isRead: 1, readAt: now })
      .where('sender_id = :targetUserId', { targetUserId })
      .andWhere('recipient_id = :currentCustomerId', { currentCustomerId })
      .andWhere('is_read = 0')
      .execute();

    const customerIds = [...new Set(messages.map((message) => message.senderId))];
    const customers = customerIds.length
      ? await this.customersRepository.findBy({ id: In(customerIds) })
      : [];
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

    return createPaginationResult(
      messages.map((message) => this.toMessageResponse(message, customerMap.get(message.senderId))),
      total,
      page,
      size,
    );
  }

  private async toUserResponses(customers: CustomerUser[], currentCustomerId: string) {
    const customerIds = customers.map((customer) => customer.id);
    const [outgoing, incoming, guestbookCounts] = await Promise.all([
      customerIds.length
        ? this.followsRepository.find({
            where: {
              followerId: currentCustomerId,
              followingId: In(customerIds),
            },
          })
        : [],
      customerIds.length
        ? this.followsRepository.find({
            where: {
              followerId: In(customerIds),
              followingId: currentCustomerId,
            },
          })
        : [],
      customerIds.length
        ? this.messagesRepository
            .createQueryBuilder('message')
            .select('message.recipientId', 'recipientId')
            .addSelect('COUNT(*)', 'count')
            .where('message.senderId = :currentCustomerId', { currentCustomerId })
            .andWhere('message.recipientId IN (:...customerIds)', { customerIds })
            .andWhere('message.deliveryMode = :deliveryMode', {
              deliveryMode: 'guestbook',
            })
            .groupBy('message.recipientId')
            .getRawMany<{ recipientId: string; count: string }>()
        : [],
    ]);
    const outgoingSet = new Set(outgoing.map((follow) => follow.followingId));
    const incomingSet = new Set(incoming.map((follow) => follow.followerId));
    const guestbookCountMap = new Map(
      guestbookCounts.map((item) => [item.recipientId, Number(item.count)]),
    );

    return customers.map((customer) => {
      const isFollowing = outgoingSet.has(customer.id);
      const isFollowedBy = incomingSet.has(customer.id);
      const isMutual = isFollowing && isFollowedBy;
      const canLeaveMessage = isMutual || (guestbookCountMap.get(customer.id) ?? 0) === 0;

      return {
        ...this.toCustomerCard(customer),
        isFollowing,
        isFollowedBy,
        isMutual,
        canChat: isMutual,
        canLeaveMessage,
      };
    });
  }

  private toCustomerCard(customer: CustomerUser) {
    return {
      id: customer.id,
      nickname: customer.nickname,
      avatar: customer.avatar,
      signature: customer.signature,
      region: customer.region,
      vipLevel: customer.vipLevel,
    };
  }

  private toMessageResponse(message: CustomerMessage, sender?: CustomerUser) {
    return {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      deliveryMode: message.deliveryMode,
      isRead: message.isRead === 1,
      readAt: message.readAt,
      createdAt: message.createdAt,
      sender: sender
        ? {
            id: sender.id,
            nickname: sender.nickname,
            avatar: sender.avatar,
          }
        : null,
    };
  }

  private async getCustomerOrThrow(customerId: string): Promise<CustomerUser> {
    const customer = await this.customersRepository.findOneBy({
      id: customerId,
      auditStatus: 'approved',
      enabled: 1,
    });
    if (!customer) {
      throw new NotFoundException(`用户 ${customerId} 不存在或不可用`);
    }
    return customer;
  }

  private async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.followsRepository.existsBy({ followerId, followingId });
  }

  private async isMutual(leftCustomerId: string, rightCustomerId: string): Promise<boolean> {
    const [leftFollowsRight, rightFollowsLeft] = await Promise.all([
      this.isFollowing(leftCustomerId, rightCustomerId),
      this.isFollowing(rightCustomerId, leftCustomerId),
    ]);
    return leftFollowsRight && rightFollowsLeft;
  }
}
