import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { AdminUser } from '../users/entities/admin-user.entity';
import { AiChatService, UploadedTextFile } from './ai-chat.service';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';

@ApiTags('admin / ai-chat')
@ApiBearerAuth()
@Controller('ai/chat')
export class AiChatController {
  constructor(private readonly chatService: AiChatService) {}

  @Post()
  @ApiOperation({ summary: '发送聊天消息' })
  chat(@Body() chatRequestDto: AiChatRequestDto, @CurrentUser() admin: AdminUser) {
    return this.chatService.chat(chatRequestDto, admin.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: '分页查询当前管理员聊天会话' })
  sessions(@Query() query: PaginationQueryDto, @CurrentUser() admin: AdminUser) {
    return this.chatService.findSessions(query, admin.id);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: '查询聊天会话消息' })
  messages(@Param('sessionId') sessionId: string, @CurrentUser() admin: AdminUser) {
    return this.chatService.findMessages(sessionId, admin.id);
  }

  @Post('summary')
  @ApiOperation({ summary: '上传文本类附件并生成概述' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        prompt: { type: 'string' },
        modelConfigId: { type: 'string' },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  summarize(
    @UploadedFiles() files: UploadedTextFile[],
    @Body('prompt') prompt: string | undefined,
    @Body('modelConfigId') modelConfigId: string | undefined,
    @CurrentUser() admin: AdminUser,
  ) {
    return this.chatService.summarizeFiles(files, prompt, admin.id, modelConfigId);
  }

  @Post('one-shot')
  @ApiOperation({ summary: '一次性 AI 问答，不读取历史，可上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        prompt: { type: 'string' },
        modelConfigId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  oneShot(
    @UploadedFiles() files: UploadedTextFile[],
    @Body('prompt') prompt: string | undefined,
    @Body('modelConfigId') modelConfigId: string | undefined,
    @CurrentUser() admin: AdminUser,
  ) {
    return this.chatService.oneShot(files, prompt, admin.id, modelConfigId);
  }
}
