import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { OpenAiCompatibleService, OpenAiMessage } from './openai-compatible.service';

export interface UploadedTextFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

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

  async chat(chatRequestDto: AiChatRequestDto, adminUserId: string) {
    const session = chatRequestDto.sessionId
      ? await this.getSessionOrThrow(chatRequestDto.sessionId, adminUserId)
      : await this.createSession(adminUserId, chatRequestDto.message);

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
      order: { createdAt: 'ASC' },
      take: 30,
    });

    const messages: OpenAiMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const result = await this.openAiCompatibleService.complete(
      messages,
      'chat',
      adminUserId,
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

  async summarizeFiles(
    files: UploadedTextFile[],
    prompt: string | undefined,
    adminUserId: string,
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
      adminUserId,
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
    adminUserId: string,
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
      adminUserId,
      modelConfigId,
    );

    return {
      text: result.content,
      usage: result.usage,
      providerCode: result.model.providerCode,
      modelName: result.model.modelName,
    };
  }

  async findSessions(query: PaginationQueryDto, adminUserId: string) {
    const { page, size, skip } = resolvePagination(query);
    const [list, total] = await this.sessionsRepository.findAndCount({
      where: { adminUserId },
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

  async findMessages(sessionId: string, adminUserId: string) {
    await this.getSessionOrThrow(sessionId, adminUserId);
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

  private async createSession(adminUserId: string, message: string) {
    return this.sessionsRepository.save(
      this.sessionsRepository.create({
        adminUserId,
        modelConfigId: null,
        title: message.slice(0, 60) || '新会话',
      }),
    );
  }

  private async getSessionOrThrow(sessionId: string, adminUserId: string): Promise<AiChatSession> {
    const session = await this.sessionsRepository.findOneBy({
      id: sessionId,
      adminUserId,
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
