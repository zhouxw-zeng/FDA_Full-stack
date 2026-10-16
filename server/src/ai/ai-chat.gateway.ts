import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Socket } from 'socket.io';
import { Public } from '../auth/decorators/public.decorator';
import { MobileTokenService } from '../mobile-auth/mobile-token.service';
import { AiChatService } from './ai-chat.service';
import { AiChatWsRequestDto } from './dto/ai-chat-ws-request.dto';

interface SocketData {
  customerId?: string;
}

interface ChatConnectedPayload {
  customerId: string;
}

interface ChatStartPayload {
  requestId: string;
  sessionId: string | null;
}

interface ChatDeltaPayload {
  requestId: string;
  sessionId: string;
  content: string;
}

interface ChatReplyPayload {
  requestId: string;
  [key: string]: unknown;
}

interface ChatDonePayload {
  requestId: string;
  sessionId: string;
}

interface ChatErrorPayload {
  requestId?: string;
  code: string;
  message: string;
}

interface ClientToServerEvents {
  'chat:send': (payload: AiChatWsRequestDto) => void;
}

interface ServerToClientEvents {
  'chat:connected': (payload: ChatConnectedPayload) => void;
  'chat:start': (payload: ChatStartPayload) => void;
  'chat:delta': (payload: ChatDeltaPayload) => void;
  'chat:reply': (payload: ChatReplyPayload) => void;
  'chat:done': (payload: ChatDonePayload) => void;
  'chat:error': (payload: ChatErrorPayload) => void;
}

type InterServerEvents = Record<string, never>;
type AiSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

@Public()
@WebSocketGateway({
  namespace: '/ai/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AiChatGateway {
  private readonly logger = new Logger(AiChatGateway.name);

  constructor(
    private readonly chatService: AiChatService,
    private readonly mobileTokenService: MobileTokenService,
  ) {}

  async handleConnection(client: AiSocket): Promise<void> {
    const accessToken = this.extractAccessToken(client);
    if (!accessToken) {
      this.emitError(client, undefined, 'UNAUTHORIZED', 'WebSocket 连接未携带 Bearer Token');
      client.disconnect(true);
      return;
    }

    try {
      const customerId = await this.mobileTokenService.validateAccessToken(accessToken);
      client.data.customerId = customerId;
      client.emit('chat:connected', {
        customerId,
      });
    } catch (error) {
      this.emitError(
        client,
        undefined,
        'UNAUTHORIZED',
        error instanceof Error ? error.message : 'WebSocket 鉴权失败',
      );
      client.disconnect(true);
    }
  }

  @SubscribeMessage('chat:send')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async handleChat(
    @ConnectedSocket() client: AiSocket,
    @MessageBody() dto: AiChatWsRequestDto,
  ): Promise<void> {
    const customerId = client.data.customerId;
    const requestId = dto.requestId?.trim() || randomUUID();

    if (!customerId) {
      this.emitError(client, requestId, 'UNAUTHORIZED', 'WebSocket 连接未通过鉴权');
      return;
    }

    client.emit('chat:start', {
      requestId,
      sessionId: dto.sessionId ?? null,
    });

    try {
      for await (const event of this.chatService.streamChat(dto, customerId)) {
        if (event.type === 'delta') {
          client.emit('chat:delta', {
            requestId,
            sessionId: event.sessionId,
            content: event.content,
          });
          continue;
        }

        client.emit('chat:reply', {
          requestId,
          sessionId: event.sessionId,
          message: event.message,
          usage: event.usage,
          providerCode: event.providerCode,
          modelName: event.modelName,
        });
        client.emit('chat:done', {
          requestId,
          sessionId: event.sessionId,
        });
      }
    } catch (error) {
      this.logger.warn(
        `WebSocket AI chat failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      this.emitError(
        client,
        requestId,
        'AI_CHAT_FAILED',
        error instanceof Error ? error.message : 'AI 问答失败',
      );
    }
  }

  private extractAccessToken(client: AiSocket): string | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    const authToken = this.normalizeToken(auth.token);
    if (authToken) {
      return authToken;
    }

    const queryToken = this.normalizeToken(client.handshake.query.token);
    if (queryToken) {
      return queryToken;
    }

    return this.normalizeToken(client.handshake.headers.authorization);
  }

  private normalizeToken(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const token = value.replace(/^Bearer\s+/i, '').trim();
    return token || null;
  }

  private emitError(
    client: AiSocket,
    requestId: string | undefined,
    code: string,
    message: string,
  ): void {
    client.emit('chat:error', {
      requestId,
      code,
      message,
    });
  }
}
