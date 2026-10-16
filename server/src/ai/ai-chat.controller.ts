import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { AiChatService, UploadedTextFile } from './ai-chat.service';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';

@ApiTags('mobile / ai-chat')
@ApiBearerAuth()
@Public()
@UseGuards(MobileAuthGuard)
@Controller('ai/chat')
export class AiChatController {
  constructor(private readonly chatService: AiChatService) {}

  @Post()
  @ApiOperation({ summary: '发送聊天消息' })
  chat(@Body() chatRequestDto: AiChatRequestDto, @CurrentMobileCustomer() customerId: string) {
    return this.chatService.chat(chatRequestDto, customerId);
  }

  @Get('sessions')
  @ApiOperation({ summary: '分页查询当前移动端用户聊天会话' })
  sessions(@Query() query: PaginationQueryDto, @CurrentMobileCustomer() customerId: string) {
    return this.chatService.findSessions(query, customerId);
  }

  @Get('sessions/:sessionId/messages')
  @ApiOperation({ summary: '查询聊天会话消息' })
  messages(@Param('sessionId') sessionId: string, @CurrentMobileCustomer() customerId: string) {
    return this.chatService.findMessages(sessionId, customerId);
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
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.chatService.summarizeFiles(files, prompt, customerId, modelConfigId);
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
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.chatService.oneShot(files, prompt, customerId, modelConfigId);
  }
}
