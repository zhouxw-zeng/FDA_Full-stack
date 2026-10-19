import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Public } from '../auth/decorators/public.decorator';
import { MobileTokenService } from '../mobile-auth/mobile-token.service';

interface SocketData {
  customerId?: string;
}

interface CustomerImMessagePayload {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveryMode: 'guestbook' | 'chat';
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    nickname: string;
    avatar: string | null;
  } | null;
}

interface ClientToServerEvents {
  'im:ping': () => void;
}

interface ServerToClientEvents {
  'im:connected': (payload: { customerId: string }) => void;
  'im:new': (payload: CustomerImMessagePayload) => void;
  'im:error': (payload: { code: string; message: string }) => void;
}

type InterServerEvents = Record<string, never>;
type CustomerImSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

@Public()
@WebSocketGateway({
  namespace: '/customer-im',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class CustomerImGateway implements OnGatewayConnection {
  private readonly logger = new Logger(CustomerImGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly mobileTokenService: MobileTokenService) {}

  async handleConnection(client: CustomerImSocket): Promise<void> {
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
      client.emit('im:connected', { customerId });
    } catch (error) {
      this.emitError(
        client,
        'UNAUTHORIZED',
        error instanceof Error ? error.message : 'WebSocket 鉴权失败',
      );
      client.disconnect(true);
    }
  }

  emitMessage(recipientId: string, message: CustomerImMessagePayload): void {
    if (!this.server) {
      this.logger.warn('Customer IM gateway is not ready');
      return;
    }

    this.server.to(this.customerRoom(recipientId)).emit('im:new', message);
  }

  private extractAccessToken(client: CustomerImSocket): string | null {
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
    return `customer-im:${customerId}`;
  }

  private emitError(client: CustomerImSocket, code: string, message: string): void {
    client.emit('im:error', { code, message });
  }
}
