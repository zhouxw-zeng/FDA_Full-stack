import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { AdminUser } from '../users/entities/admin-user.entity';
import { AuditForumDynamicDto } from './dto/audit-forum-dynamic.dto';
import { DeleteForumDynamicResponseDto } from './dto/delete-forum-dynamic-response.dto';
import { CreateForumCommentDto } from './dto/create-forum-comment.dto';
import { ForumFavoriteDto } from './dto/forum-favorite.dto';
import { ForumInteractionDto } from './dto/forum-interaction.dto';
import { ForumDynamicPageResponseDto } from './dto/forum-dynamic-page-response.dto';
import { ForumDynamicResponseDto } from './dto/forum-dynamic-response.dto';
import { QueryForumCommentDto } from './dto/query-forum-comment.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { ShareForumDynamicDto } from './dto/share-forum-dynamic.dto';
import { UpdateForumDynamicStatusDto } from './dto/update-forum-dynamic-status.dto';
import { UpdateForumDynamicDto } from './dto/update-forum-dynamic.dto';
import { ForumCommentsService } from './forum-comments.service';
import { ForumInteractionsService } from './forum-interactions.service';
import { ForumService } from './forum.service';

@ApiTags('mobile / forum')
@ApiBearerAuth()
@ApiExtraModels(ForumDynamicResponseDto, ForumDynamicPageResponseDto, DeleteForumDynamicResponseDto)
@Controller('forum')
export class ForumController {
  constructor(
    private readonly forumService: ForumService,
    private readonly interactionsService: ForumInteractionsService,
    private readonly commentsService: ForumCommentsService,
  ) {}

  @Get('dynamics')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '分页查询论坛动态（仅 C 端 token）' })
  @ApiOkResponse(
    apiDataResponse(ForumDynamicPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(
    @Query() queryForumDynamicDto: QueryForumDynamicDto,
    @CurrentMobileCustomer() customerId?: string,
  ) {
    return this.forumService.findAll(queryForumDynamicDto, customerId);
  }

  @Put('dynamics/like')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '点赞或取消点赞动态' })
  toggleLike(@Body() dto: ForumInteractionDto, @CurrentMobileCustomer() customerId: string) {
    return this.interactionsService.toggleLike(dto, customerId);
  }

  @Put('dynamics/favorite')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '收藏或取消收藏动态' })
  toggleFavorite(@Body() dto: ForumFavoriteDto, @CurrentMobileCustomer() customerId: string) {
    return this.interactionsService.toggleFavorite(dto, customerId);
  }

  @Post('dynamics/share')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '记录动态分享事件' })
  share(@Body() dto: ShareForumDynamicDto, @CurrentMobileCustomer() customerId: string) {
    return this.interactionsService.share(dto, customerId);
  }

  @Post('comments')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '发表评论或回复' })
  createComment(@Body() dto: CreateForumCommentDto, @CurrentMobileCustomer() customerId: string) {
    return this.commentsService.create(dto, customerId);
  }

  @Get('dynamics/:id/comments')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '分页查询动态顶级评论' })
  findComments(
    @Param('id') id: string,
    @Query() query: QueryForumCommentDto,
    @CurrentMobileCustomer() customerId?: string,
  ) {
    return this.commentsService.findTopLevel(id, query, customerId);
  }

  @Get('comments/:rootId/replies')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '分页查询评论回复' })
  findReplies(
    @Param('rootId') rootId: string,
    @Query() query: QueryForumCommentDto,
    @CurrentMobileCustomer() customerId?: string,
  ) {
    return this.commentsService.findReplies(rootId, query, customerId);
  }

  @Delete('comments/:id')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '删除自己的评论' })
  deleteComment(@Param('id') id: string, @CurrentMobileCustomer() customerId: string) {
    return this.commentsService.remove(id, customerId);
  }

  @Put('dynamics/audit')
  @ApiOperation({ summary: '审批论坛动态' })
  @ApiOkResponse(apiDataResponse(ForumDynamicResponseDto, { description: '审批成功' }))
  audit(@Body() auditForumDynamicDto: AuditForumDynamicDto, @CurrentUser() admin: AdminUser) {
    return this.forumService.audit(auditForumDynamicDto, admin.id);
  }

  @Put('dynamics/status')
  @ApiOperation({ summary: '下架或启用论坛动态' })
  @ApiOkResponse(apiDataResponse(ForumDynamicResponseDto, { description: '状态更新成功' }))
  updateStatus(
    @Body() updateForumDynamicStatusDto: UpdateForumDynamicStatusDto,
    @CurrentUser() admin: AdminUser,
  ) {
    return this.forumService.updateStatus(updateForumDynamicStatusDto, admin.id);
  }

  @Put('dynamics')
  @ApiOperation({ summary: '编辑论坛动态并记录变更日志' })
  @ApiOkResponse(apiDataResponse(ForumDynamicResponseDto, { description: '编辑成功' }))
  update(@Body() updateForumDynamicDto: UpdateForumDynamicDto, @CurrentUser() admin: AdminUser) {
    return this.forumService.update(updateForumDynamicDto, admin.id);
  }

  @Get('dynamics/:id')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '查询论坛动态详情（仅 C 端 token）' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(
    apiDataResponse(ForumDynamicResponseDto, {
      description: '查询成功',
    }),
  )
  findOne(@Param('id') id: string, @CurrentMobileCustomer() customerId?: string) {
    return this.forumService.findOne(id, customerId);
  }

  @Delete('dynamics/:id')
  @ApiOperation({ summary: '删除论坛动态' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(
    apiDataResponse(DeleteForumDynamicResponseDto, {
      description: '删除成功',
    }),
  )
  remove(@Param('id') id: string) {
    return this.forumService.remove(id);
  }

  @Get('media/preview')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '查询动态媒体预览素材（仅 C 端 token）' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'ok' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ForumMediaItemResponseDto' },
        },
      },
    },
  })
  findPreviewMedia() {
    return this.forumService.findPreviewMedia();
  }
}
