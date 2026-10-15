import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { ForumDynamicPageResponseDto } from './dto/forum-dynamic-page-response.dto';
import { ForumDynamicResponseDto } from './dto/forum-dynamic-response.dto';
import { QueryForumDynamicDto } from './dto/query-forum-dynamic.dto';
import { ForumService } from './forum.service';

/**
 * 管理后台专用的论坛动态读接口。
 *
 * `/forum/dynamics` 只接受 C 端 token（移动端使用），管理端 token 不能跨端调用，
 * 因此管理后台的列表 / 详情 / 素材预览走这里（默认全局管理端守卫）。
 */
@ApiTags('admin / forum-dynamics')
@ApiBearerAuth()
@ApiExtraModels(ForumDynamicResponseDto, ForumDynamicPageResponseDto)
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
