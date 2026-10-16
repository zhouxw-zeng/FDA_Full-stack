import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatSession } from './entities/ai-chat-session.entity';
import {
  OpenAiCompatibleService,
  OpenAiCompletionResult,
  OpenAiMessage,
} from './openai-compatible.service';

export interface UploadedTextFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export type AiChatStreamEvent =
  | {
      type: 'delta';
      sessionId: string;
      content: string;
    }
  | {
      type: 'done';
      sessionId: string;
      message: {
        id: string;
        role: 'assistant';
        content: string;
        createdAt: Date;
      };
      usage: OpenAiCompletionResult['usage'];
      providerCode: string;
      modelName: string;
    };

const TEXT_FILE_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.log', '.xml', '.yaml', '.yml'];

@Injectable()
export class AiChatService {
  constructor(
    @InjectRepository(AiChatSession)
    private readonly sessionsRepository: Repository<AiChatSession>,
    @InjectRepository(AiChatMessage)
    private readonly messagesRepository: Repository<AiChatMessage>,
    private readonly openAiCompatibleService: OpenAiCompatibleService,
  ) {}

  async chat(chatRequestDto: AiChatRequestDto, customerId: string) {
    const session = chatRequestDto.sessionId
      ? await this.getSessionOrThrow(chatRequestDto.sessionId, customerId)
      : await this.createSession(customerId, chatRequestDto.message);

    if (chatRequestDto.modelConfigId) {
      session.modelConfigId = chatRequestDto.modelConfigId;
      await this.sessionsRepository.save(session);
    }

    const userContent = this.buildUserContent(chatRequestDto.message, chatRequestDto.attachments);
    await this.messagesRepository.save(
      this.messagesRepository.create({
        sessionId: session.id,
        role: 'user',
        content: userContent,
        attachments: chatRequestDto.attachments ?? null,
      }),
    );

    const history = await this.messagesRepository.find({
      where: { sessionId: session.id },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    history.reverse();

    const messages: OpenAiMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const result = await this.openAiCompatibleService.complete(
      messages,
      'chat',
      customerId,
      session.modelConfigId ?? undefined,
    );

    const assistantMessage = await this.messagesRepository.save(
      this.messagesRepository.create({
        sessionId: session.id,
        role: 'assistant',
        content: result.content,
        attachments: null,
      }),
    );

    return {
      sessionId: session.id,
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      usage: result.usage,
      providerCode: result.model.providerCode,
      modelName: result.model.modelName,
    };
  }

  async *streamChat(
    chatRequestDto: AiChatRequestDto,
    customerId: string,
  ): AsyncGenerator<AiChatStreamEvent, void, void> {
    const session = chatRequestDto.sessionId
      ? await this.getSessionOrThrow(chatRequestDto.sessionId, customerId)
      : await this.createSession(customerId, chatRequestDto.message);

    if (chatRequestDto.modelConfigId) {
      session.modelConfigId = chatRequestDto.modelConfigId;
      await this.sessionsRepository.save(session);
    }

    const userContent = this.buildUserContent(chatRequestDto.message, chatRequestDto.attachments);
    await this.messagesRepository.save(
      this.messagesRepository.create({
        sessionId: session.id,
        role: 'user',
        content: userContent,
        attachments: chatRequestDto.attachments ?? null,
      }),
    );

    const history = await this.messagesRepository.find({
      where: { sessionId: session.id },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    history.reverse();

    const messages: OpenAiMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    let result: OpenAiCompletionResult | null = null;
    for await (const event of this.openAiCompatibleService.stream(
      messages,
      'chat',
      customerId,
      session.modelConfigId ?? undefined,
    )) {
      if (event.type === 'delta') {
        yield {
          type: 'delta',
          sessionId: session.id,
          content: event.content,
        };
        continue;
      }

      result = event.result;
    }

    if (!result) {
      throw new BadGatewayException('AI 流式调用未返回完整结果');
    }

    const assistantMessage = await this.messagesRepository.save(
      this.messagesRepository.create({
        sessionId: session.id,
        role: 'assistant',
        content: result.content,
        attachments: null,
      }),
    );

    yield {
      type: 'done',
      sessionId: session.id,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      usage: result.usage,
      providerCode: result.model.providerCode,
      modelName: result.model.modelName,
    };
  }

  async summarizeFiles(
    files: UploadedTextFile[],
    prompt: string | undefined,
    customerId: string,
    modelConfigId?: string,
  ) {
    if (!files.length) {
      throw new BadRequestException('请至少上传一个文本类附件');
    }

    const attachmentTexts = files.map((file) => this.extractTextFile(file));
    const content = [
      prompt?.trim() || '请对上传附件生成结构化概述，并提炼关键事项。',
      '',
      ...attachmentTexts.map((item) => `【附件：${item.name}】\n${item.content}`),
    ].join('\n');

    const result = await this.openAiCompatibleService.complete(
      [{ role: 'user', content }],
      'summary',
      customerId,
      modelConfigId,
    );

    return {
      summary: result.content,
      usage: result.usage,
      providerCode: result.model.providerCode,
      modelName: result.model.modelName,
    };
  }

  async oneShot(
    files: UploadedTextFile[],
    prompt: string | undefined,
    customerId: string,
    modelConfigId?: string,
  ) {
    const imageFiles = files.map((file) => {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `附件 ${file.originalname} 不是图片，疑似一次性问答仅支持上传图片`,
        );
      }

      return {
        type: 'image_url' as const,
        image_url: {
          url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        },
      };
    });

    if (imageFiles.length === 0 && !prompt?.trim()) {
      throw new BadRequestException('请上传图片或输入提示词');
    }

    const result = await this.openAiCompatibleService.complete(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt?.trim() || '请根据上传图片返回一段简短中文文本，不要解释分析过程。',
            },
            ...imageFiles,
          ],
        },
      ],
      'one-shot',
      customerId,
      modelConfigId,
    );

    return {
      text: result.content,
      usage: result.usage,
      providerCode: result.model.providerCode,
      modelName: result.model.modelName,
    };
  }

  async findSessions(query: PaginationQueryDto, customerId: string) {
    const { page, size, skip } = resolvePagination(query);
    const [list, total] = await this.sessionsRepository.findAndCount({
      where: { customerId },
      order: { updatedAt: 'DESC' },
      skip,
      take: size,
    });

    return createPaginationResult(
      list.map((session) => ({
        id: session.id,
        modelConfigId: session.modelConfigId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      total,
      page,
      size,
    );
  }

  async findMessages(sessionId: string, customerId: string) {
    await this.getSessionOrThrow(sessionId, customerId);
    const messages = await this.messagesRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });

    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      attachments: message.attachments,
      createdAt: message.createdAt,
    }));
  }

  async removeMessage(messageId: string, customerId: string) {
    const message = await this.messagesRepository.findOneBy({ id: messageId });
    if (!message) {
      throw new NotFoundException(`AI 聊天消息 ${messageId} 不存在`);
    }

    await this.getSessionOrThrow(message.sessionId, customerId);
    await this.messagesRepository.delete(message.id);
    await this.sessionsRepository.update(message.sessionId, { updatedAt: new Date() });

    return { success: true, id: messageId };
  }

  async removeSession(sessionId: string, customerId: string) {
    await this.getSessionOrThrow(sessionId, customerId);
    await this.sessionsRepository.delete(sessionId);

    return { success: true, id: sessionId };
  }

  async clearSessionMessages(sessionId: string, customerId: string) {
    await this.getSessionOrThrow(sessionId, customerId);
    const result = await this.messagesRepository.delete({ sessionId });
    await this.sessionsRepository.update(sessionId, { updatedAt: new Date() });

    return {
      success: true,
      sessionId,
      deletedCount: result.affected ?? 0,
    };
  }

  async clearSessions(customerId: string) {
    const sessions = await this.sessionsRepository.findBy({ customerId });
    const sessionIds = sessions.map((session) => session.id);
    const deletedMessages = sessionIds.length
      ? await this.messagesRepository.count({
          where: { sessionId: In(sessionIds) },
        })
      : 0;

    if (sessionIds.length > 0) {
      await this.sessionsRepository.delete({ customerId });
    }

    return {
      success: true,
      deletedSessions: sessions.length,
      deletedMessages,
    };
  }

  private async createSession(customerId: string, message: string) {
    return this.sessionsRepository.save(
      this.sessionsRepository.create({
        adminUserId: null,
        customerId,
        modelConfigId: null,
        title: message.slice(0, 60) || '新会话',
      }),
    );
  }

  private async getSessionOrThrow(sessionId: string, customerId: string): Promise<AiChatSession> {
    const session = await this.sessionsRepository.findOneBy({
      id: sessionId,
      customerId,
    });

    if (!session) {
      throw new NotFoundException(`AI 会话 ${sessionId} 不存在`);
    }

    return session;
  }

  private buildUserContent(
    message: string,
    attachments?: Array<{ name: string; mimeType?: string; content: string }>,
  ): string {
    if (!attachments?.length) {
      return message;
    }

    return [
      message,
      '',
      ...attachments.map((attachment) => {
        return `【附件：${attachment.name}】\n${attachment.content}`;
      }),
    ].join('\n');
  }

  private extractTextFile(file: UploadedTextFile): { name: string; content: string } {
    const lowerName = file.originalname.toLowerCase();
    const isTextMime = file.mimetype.startsWith('text/');
    const isTextExtension = TEXT_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

    if (!isTextMime && !isTextExtension) {
      throw new BadRequestException(
        `附件 ${file.originalname} 暂不支持解析，请上传 txt、md、json、csv、log、xml、yaml 文件`,
      );
    }

    return {
      name: file.originalname,
      content: file.buffer.toString('utf8'),
    };
  }
}
