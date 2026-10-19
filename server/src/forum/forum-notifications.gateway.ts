import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Public } from '../auth/decorators/public.decorator';
import { MobileTokenService } from '../mobile-auth/mobile-token.service';

interface SocketData {
  customerId?: string;
}

interface NotificationPayload {
  id: string;
  type: string;
  dynamicId: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    nickname: string;
    avatar: string | null;
  } | null;
  dynamic: {
    id: string;
    title: string | null;
    content: string;
    topic: string;
  } | null;
  message: string;
}

interface ClientToServerEvents {
  'notification:ping': () => void;
}

interface ServerToClientEvents {
  'notification:connected': (payload: { customerId: string }) => void;
  'notification:new': (payload: { notification: NotificationPayload; unreadCount: number }) => void;
  'notification:error': (payload: { code: string; message: string }) => void;
}

type InterServerEvents = Record<string, never>;
type NotificationSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

@Public()
@WebSocketGateway({
  namespace: '/forum/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ForumNotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ForumNotificationsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly mobileTokenService: MobileTokenService) {}

  async handleConnection(client: NotificationSocket): Promise<void> {
    const accessToken = this.extractAccessToken(client);
    if (!accessToken) {
      this.emitError(client, 'UNAUTHORIZED', 'WebSocket 连接未携带 Bearer Token');
      client.disconnect(true);
      return;
    }

    try {
      const customerId = await this.mobileTokenService.validateAccessToken(accessToken);
      client.data.customerId = customerId;
      await client.join(this.customerRoom(customerId));
      client.emit('notification:connected', { customerId });
    } catch (error) {
      this.emitError(
        client,
        'UNAUTHORIZED',
        error instanceof Error ? error.message : 'WebSocket 鉴权失败',
      );
      client.disconnect(true);
    }
  }

  emitNewNotification(
    customerId: string,
    notification: NotificationPayload,
    unreadCount: number,
  ): void {
    if (!this.server) {
      this.logger.warn('Forum notification gateway is not ready');
      return;
    }

    this.server.to(this.customerRoom(customerId)).emit('notification:new', {
      notification,
      unreadCount,
    });
  }

  private extractAccessToken(client: NotificationSocket): string | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    const authToken = this.normalizeToken(auth.token);
    if (authToken) {
      return authToken;
    }

    return this.normalizeToken(client.handshake.query.token);
  }

  private normalizeToken(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const token = value.replace(/^Bearer\s+/i, '').trim();
    return token || null;
  }

  private customerRoom(customerId: string): string {
    return `forum-notifications:${customerId}`;
  }

  private emitError(client: NotificationSocket, code: string, message: string): void {
    client.emit('notification:error', { code, message });
  }
}
