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
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { CreateForumCommentDto } from './dto/create-forum-comment.dto';
import { CreateMyForumDynamicDto } from './dto/create-my-forum-dynamic.dto';
import { DeleteForumDynamicResponseDto } from './dto/delete-forum-dynamic-response.dto';
import { ForumFavoriteDto } from './dto/forum-favorite.dto';
import { ForumInteractionDto } from './dto/forum-interaction.dto';
import { ForumDynamicPageResponseDto } from './dto/forum-dynamic-page-response.dto';
import { ForumDynamicResponseDto } from './dto/forum-dynamic-response.dto';
import { QueryForumCommentDto } from './dto/query-forum-comment.dto';
import { QueryMyForumDynamicDto } from './dto/query-my-forum-dynamic.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { ShareForumDynamicDto } from './dto/share-forum-dynamic.dto';
import { UpdateMyForumDynamicDto } from './dto/update-my-forum-dynamic.dto';
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
    return this.forumService.findAll(
      { ...queryForumDynamicDto, auditStatus: 'approved', enabled: 1 },
      customerId,
    );
  }

  @Get('dynamics/mine')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '分页查询当前移动端用户自己的动态' })
  @ApiOkResponse(
    apiDataResponse(ForumDynamicPageResponseDto, {
      description: '查询成功',
    }),
  )
  findMine(
    @Query() queryMyForumDynamicDto: QueryMyForumDynamicDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.forumService.findMine(queryMyForumDynamicDto, customerId);
  }

  @Post('dynamics')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '发布动态（C 端用户，进入待审批状态）' })
  @ApiOkResponse(
    apiDataResponse(ForumDynamicResponseDto, {
      description: '发布成功',
    }),
  )
  createMine(
    @Body() createMyForumDynamicDto: CreateMyForumDynamicDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.forumService.createMine(createMyForumDynamicDto, customerId);
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

  @Put('dynamics/:id')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '编辑自己的动态，编辑后重新进入待审批状态' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(apiDataResponse(ForumDynamicResponseDto, { description: '编辑成功' }))
  updateMine(
    @Param('id') id: string,
    @Body() updateMyForumDynamicDto: UpdateMyForumDynamicDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.forumService.updateMine(id, updateMyForumDynamicDto, customerId);
  }

  @Delete('dynamics/:id')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '删除自己的动态' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(apiDataResponse(DeleteForumDynamicResponseDto, { description: '删除成功' }))
  removeMine(@Param('id') id: string, @CurrentMobileCustomer() customerId: string) {
    return this.forumService.removeMine(id, customerId);
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
