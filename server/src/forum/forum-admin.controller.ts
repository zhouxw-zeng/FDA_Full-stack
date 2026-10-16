import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminUser } from '../users/entities/admin-user.entity';
import { AuditForumDynamicDto } from './dto/audit-forum-dynamic.dto';
import { DeleteForumDynamicResponseDto } from './dto/delete-forum-dynamic-response.dto';
import { ForumDynamicPageResponseDto } from './dto/forum-dynamic-page-response.dto';
import { ForumDynamicResponseDto } from './dto/forum-dynamic-response.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { UpdateForumDynamicStatusDto } from './dto/update-forum-dynamic-status.dto';
import { UpdateForumDynamicDto } from './dto/update-forum-dynamic.dto';
import { ForumService } from './forum.service';

/**
 * 管理后台专用的论坛动态接口。
 *
 * `/forum/dynamics` 只接受 C 端 token（移动端使用），管理端 token 不能跨端调用，
 * 因此管理后台的列表 / 详情 / 素材预览 / 审批 / 状态 / 编辑 / 删除都走这里。
 */
@ApiTags('admin / forum-dynamics')
@ApiBearerAuth()
@ApiExtraModels(ForumDynamicResponseDto, ForumDynamicPageResponseDto, DeleteForumDynamicResponseDto)
@Controller('forum/admin')
export class ForumAdminController {
  constructor(private readonly forumService: ForumService) {}

  @Get('dynamics')
  @ApiOperation({ summary: '分页查询论坛动态（管理端）' })
  @ApiOkResponse(
    apiDataResponse(ForumDynamicPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryForumDynamicDto: QueryForumDynamicDto) {
    return this.forumService.findAll(queryForumDynamicDto);
  }

  @Get('dynamics/:id')
  @ApiOperation({ summary: '查询论坛动态详情（管理端）' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(apiDataResponse(ForumDynamicResponseDto, { description: '查询成功' }))
  findOne(@Param('id') id: string) {
    return this.forumService.findOne(id);
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

  @Delete('dynamics/:id')
  @ApiOperation({ summary: '删除论坛动态' })
  @ApiParam({ name: 'id', example: 'D-5000' })
  @ApiOkResponse(apiDataResponse(DeleteForumDynamicResponseDto, { description: '删除成功' }))
  remove(@Param('id') id: string) {
    return this.forumService.remove(id);
  }

  @Get('media/preview')
  @ApiOperation({ summary: '查询动态媒体预览素材（管理端）' })
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
