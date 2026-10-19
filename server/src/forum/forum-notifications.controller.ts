import { Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { ForumNotificationsService } from './forum-notifications.service';

@ApiTags('mobile / forum')
@ApiBearerAuth()
@Public()
@UseGuards(MobileAuthGuard)
@Controller('forum/notifications')
export class ForumNotificationsController {
  constructor(private readonly notificationsService: ForumNotificationsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询当前移动端用户消息通知' })
  @ApiOkResponse({ description: '查询成功' })
  findAll(@Query() query: PaginationQueryDto, @CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.findAll(query, customerId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '查询当前移动端用户未读消息数量' })
  @ApiOkResponse({ description: '查询成功' })
  unreadCount(@CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.unreadCount(customerId);
  }

  @Put('read-all')
  @ApiOperation({ summary: '全部标记为已读' })
  @ApiOkResponse({ description: '操作成功' })
  markAllRead(@CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.markAllRead(customerId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记单条消息为已读' })
  @ApiOkResponse({ description: '操作成功' })
  markRead(@Param('id') id: string, @CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.markRead(id, customerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除单条消息' })
  @ApiOkResponse({ description: '删除成功' })
  remove(@Param('id') id: string, @CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.remove(id, customerId);
  }

  @Delete()
  @ApiOperation({ summary: '清空当前用户全部消息' })
  @ApiOkResponse({ description: '清空成功' })
  clear(@CurrentMobileCustomer() customerId: string) {
    return this.notificationsService.clear(customerId);
  }
}
