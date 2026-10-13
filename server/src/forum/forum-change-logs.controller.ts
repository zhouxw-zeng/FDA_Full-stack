import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { CreateForumChangeLogDto } from './dto/create-forum-change-log.dto';
import { ForumChangeLogPageResponseDto } from './dto/forum-change-log-page-response.dto';
import { ForumChangeLogResponseDto } from './dto/forum-change-log-response.dto';
import { QueryForumChangeLogDto } from './dto/query-forum-change-log.dto';
import { ForumChangeLogsService } from './forum-change-logs.service';

@ApiTags('forum-change-logs')
@ApiBearerAuth()
@ApiExtraModels(ForumChangeLogResponseDto, ForumChangeLogPageResponseDto)
@Controller('forum/change-logs')
export class ForumChangeLogsController {
  constructor(private readonly changeLogsService: ForumChangeLogsService) {}

  @Post()
  @ApiOperation({ summary: '新增论坛变更记录' })
  @ApiCreatedResponse(
    apiDataResponse(ForumChangeLogResponseDto, {
      status: 201,
      description: '新增成功',
    }),
  )
  create(@Body() createForumChangeLogDto: CreateForumChangeLogDto) {
    return this.changeLogsService.create(createForumChangeLogDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询论坛变更记录' })
  @ApiOkResponse(
    apiDataResponse(ForumChangeLogPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryForumChangeLogDto: QueryForumChangeLogDto) {
    return this.changeLogsService.findAll(queryForumChangeLogDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询论坛变更记录详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(ForumChangeLogResponseDto, {
      description: '查询成功',
    }),
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.changeLogsService.findOne(String(id));
  }
}
