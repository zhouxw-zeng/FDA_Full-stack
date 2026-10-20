import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { ForumDynamic } from '../forum/entities/forum-dynamic.entity';
import { ForumNotificationsService } from '../forum/forum-notifications.service';
import { ForumService } from '../forum/forum.service';
import { CustomerImGateway } from './customer-im.gateway';
import { FollowCustomerDto } from './dto/follow-customer.dto';
import { PinConversationDto } from './dto/pin-conversation.dto';
import { QuerySocialUserDto } from './dto/query-social-user.dto';
import { SendCustomerMessageDto } from './dto/send-customer-message.dto';
import { CustomerConversation } from './entities/customer-conversation.entity';
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
    @InjectRepository(CustomerConversation)
    private readonly conversationsRepository: Repository<CustomerConversation>,
    @InjectRepository(ForumDynamic)
    private readonly dynamicsRepository: Repository<ForumDynamic>,
    private readonly customerImGateway: CustomerImGateway,
    private readonly forumNotificationsService: ForumNotificationsService,
    private readonly forumService: ForumService,
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

  async findFollowing(query: PaginationQueryDto, currentCustomerId: string) {
    return this.findFollowList(query, currentCustomerId, 'following');
  }

  async findFollowers(query: PaginationQueryDto, currentCustomerId: string) {
    return this.findFollowList(query, currentCustomerId, 'followers');
  }

  async findUser(userId: string, currentCustomerId: string) {
    const customer = await this.getCustomerOrThrow(userId);
    const [user] = await this.toUserResponses([customer], currentCustomerId);
    return {
      ...user,
      ...(await this.getCustomerStats(userId)),
    };
  }

  async findUserDynamics(userId: string, query: PaginationQueryDto, currentCustomerId: string) {
    await this.getCustomerOrThrow(userId);
    return this.forumService.findByCustomer(userId, query, currentCustomerId);
  }

  async getStats(currentCustomerId: string) {
    const { followingCount, followersCount, dynamicCount } =
      await this.getCustomerStats(currentCustomerId);

    return {
      following: followingCount,
      followers: followersCount,
      dynamics: dynamicCount,
    };
  }

  async openConversation(targetUserId: string, currentCustomerId: string) {
    if (targetUserId === currentCustomerId) {
      throw new ConflictException('不能和自己创建会话');
    }

    const target = await this.getCustomerOrThrow(targetUserId);
    const [customerAId, customerBId] = this.normalizePair(currentCustomerId, targetUserId);

    await this.conversationsRepository
      .createQueryBuilder()
      .insert()
      .into(CustomerConversation)
      .values({ customerAId, customerBId, lastMessageId: null, lastMessageAt: null })
      .orIgnore()
      .execute();

    const conversation = await this.conversationsRepository.findOneBy({
      customerAId,
      customerBId,
    });
    if (!conversation) {
      throw new NotFoundException('会话创建失败');
    }

    const currentIsA = conversation.customerAId === currentCustomerId;
    await this.conversationsRepository.update(
      conversation.id,
      currentIsA ? { deletedByA: 0 } : { deletedByB: 0 },
    );
    if (currentIsA) {
      conversation.deletedByA = 0;
    } else {
      conversation.deletedByB = 0;
    }

    const unreadCount = await this.messagesRepository.count({
      where: {
        senderId: targetUserId,
        recipientId: currentCustomerId,
        isRead: 0,
      },
    });

    return this.toConversationResponse(conversation, target, null, unreadCount, currentCustomerId);
  }

  async findConversations(query: PaginationQueryDto, currentCustomerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const [conversations, total] = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .where(
        '((conversation.customerAId = :currentCustomerId AND conversation.deletedByA = 0) OR (conversation.customerBId = :currentCustomerId AND conversation.deletedByB = 0))',
        { currentCustomerId },
      )
      .orderBy(
        'CASE WHEN conversation.customer_a_id = :currentCustomerId THEN conversation.pinned_by_a ELSE conversation.pinned_by_b END',
        'DESC',
      )
      .addOrderBy('conversation.lastMessageAt', 'DESC')
      .addOrderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('conversation.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    const peerIds = conversations.map((conversation) =>
      conversation.customerAId === currentCustomerId
        ? conversation.customerBId
        : conversation.customerAId,
    );
    const messageIds = conversations
      .map((conversation) => conversation.lastMessageId)
      .filter((messageId): messageId is string => Boolean(messageId));

    const [peers, messages] = await Promise.all([
      peerIds.length ? this.customersRepository.findBy({ id: In(peerIds) }) : [],
      messageIds.length ? this.messagesRepository.findBy({ id: In(messageIds) }) : [],
    ]);
    const peerMap = new Map(peers.map((peer) => [peer.id, peer]));
    const messageMap = new Map(messages.map((message) => [message.id, message]));
    const unreadRows = peerIds.length
      ? await this.messagesRepository
          .createQueryBuilder('message')
          .select('message.senderId', 'senderId')
          .addSelect('COUNT(*)', 'count')
          .where('message.recipientId = :currentCustomerId', { currentCustomerId })
          .andWhere('message.isRead = 0')
          .andWhere('message.senderId IN (:...peerIds)', { peerIds })
          .groupBy('message.senderId')
          .getRawMany<{ senderId: string; count: string }>()
      : [];
    const unreadMap = new Map(unreadRows.map((row) => [row.senderId, Number(row.count)]));

    const list = conversations.flatMap((conversation) => {
      const peerId =
        conversation.customerAId === currentCustomerId
          ? conversation.customerBId
          : conversation.customerAId;
      const peer = peerMap.get(peerId);
      if (!peer) {
        return [];
      }

      const lastMessage = conversation.lastMessageId
        ? (messageMap.get(conversation.lastMessageId) ?? null)
        : null;
      return [
        this.toConversationResponse(
          conversation,
          peer,
          lastMessage,
          unreadMap.get(peerId) ?? 0,
          currentCustomerId,
        ),
      ];
    });

    return createPaginationResult(list, total, page, size);
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

  async pinConversation(
    conversationId: string,
    dto: PinConversationDto,
    currentCustomerId: string,
  ) {
    const conversation = await this.getConversationOrThrow(conversationId, currentCustomerId);
    const currentIsA = conversation.customerAId === currentCustomerId;
    await this.conversationsRepository.update(
      conversation.id,
      currentIsA ? { pinnedByA: dto.pinned ? 1 : 0 } : { pinnedByB: dto.pinned ? 1 : 0 },
    );

    return {
      success: true,
      id: conversation.id,
      isPinned: dto.pinned,
    };
  }

  async removeConversation(conversationId: string, currentCustomerId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, currentCustomerId);
    const currentIsA = conversation.customerAId === currentCustomerId;
    await this.conversationsRepository.update(
      conversation.id,
      currentIsA ? { deletedByA: 1, pinnedByA: 0 } : { deletedByB: 1, pinnedByB: 0 },
    );

    return { success: true, id: conversation.id };
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

    const [customerAId, customerBId] = this.normalizePair(currentCustomerId, dto.recipientId);
    await this.conversationsRepository
      .createQueryBuilder()
      .insert()
      .into(CustomerConversation)
      .values({ customerAId, customerBId, lastMessageId: null, lastMessageAt: null })
      .orIgnore()
      .execute();
    await this.conversationsRepository.update(
      { customerAId, customerBId },
      {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        deletedByA: 0,
        deletedByB: 0,
      },
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

  private async findFollowList(
    query: PaginationQueryDto,
    currentCustomerId: string,
    mode: 'following' | 'followers',
  ) {
    const { page, size, skip } = resolvePagination(query);
    const relationColumn = mode === 'following' ? 'follow.following_id' : 'follow.follower_id';
    const ownerColumn = mode === 'following' ? 'follow.follower_id' : 'follow.following_id';
    const buildQuery = () =>
      this.followsRepository
        .createQueryBuilder('follow')
        .innerJoin(
          CustomerUser,
          'customer',
          `customer.id = ${relationColumn} AND customer.audit_status = :auditStatus AND customer.enabled = :enabled`,
          { auditStatus: 'approved', enabled: 1 },
        )
        .where(`${ownerColumn} = :currentCustomerId`, { currentCustomerId });

    const total = await buildQuery().getCount();
    const rows = await buildQuery()
      .select(relationColumn, 'userId')
      .orderBy('follow.created_at', 'DESC')
      .addOrderBy('follow.id', 'DESC')
      .skip(skip)
      .take(size)
      .getRawMany<{ userId: string }>();
    const userIds = rows.map((row) => row.userId);
    const customers = userIds.length
      ? await this.customersRepository.findBy({ id: In(userIds) })
      : [];
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
    const list = await this.toUserResponses(customers, currentCustomerId);
    const orderedList = userIds.flatMap((userId) => {
      const customer = customerMap.get(userId);
      return customer
        ? [list.find((item) => item.id === customer.id) ?? this.toCustomerCard(customer)]
        : [];
    });

    return createPaginationResult(orderedList, total, page, size);
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

  private normalizePair(left: string, right: string): [string, string] {
    return BigInt(left) <= BigInt(right) ? [left, right] : [right, left];
  }

  private toConversationResponse(
    conversation: CustomerConversation,
    peer: CustomerUser,
    lastMessage: CustomerMessage | null = null,
    unreadCount = 0,
    currentCustomerId?: string,
  ) {
    const currentIsA = conversation.customerAId === currentCustomerId;
    return {
      id: conversation.id,
      user: this.toCustomerCard(peer),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      lastMessageAt: conversation.lastMessageAt,
      isPinned: currentIsA ? conversation.pinnedByA === 1 : conversation.pinnedByB === 1,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private async getCustomerStats(customerId: string) {
    const [followingCount, followersCount, dynamicCount] = await Promise.all([
      this.followsRepository.count({ where: { followerId: customerId } }),
      this.followsRepository.count({ where: { followingId: customerId } }),
      this.dynamicsRepository.count({ where: { customerId } }),
    ]);

    return { followingCount, followersCount, dynamicCount };
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

  private async getConversationOrThrow(
    conversationId: string,
    currentCustomerId: string,
  ): Promise<CustomerConversation> {
    const conversation = await this.conversationsRepository.findOneBy({
      id: conversationId,
    });
    if (
      !conversation ||
      (conversation.customerAId !== currentCustomerId &&
        conversation.customerBId !== currentCustomerId)
    ) {
      throw new NotFoundException(`会话 ${conversationId} 不存在`);
    }

    return conversation;
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
