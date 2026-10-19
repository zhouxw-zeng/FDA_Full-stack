import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { FollowCustomerDto } from './dto/follow-customer.dto';
import { QuerySocialUserDto } from './dto/query-social-user.dto';
import { SendCustomerMessageDto } from './dto/send-customer-message.dto';
import { SocialService } from './social.service';

@ApiTags('mobile / social')
@ApiBearerAuth()
@Public()
@UseGuards(MobileAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('users')
  @ApiOperation({ summary: '按昵称模糊搜索用户并返回关注状态（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findUsers(@Query() query: QuerySocialUserDto, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.findUsers(query, customerId);
  }

  @Get('friends')
  @ApiOperation({ summary: '分页查询互相关注好友（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findFriends(@Query() query: PaginationQueryDto, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.findFriends(query, customerId);
  }

  @Put('follows')
  @ApiOperation({ summary: '关注指定用户（移动端）' })
  @ApiOkResponse({ description: '关注成功' })
  follow(@Body() dto: FollowCustomerDto, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.follow(dto, customerId);
  }

  @Delete('follows/:targetUserId')
  @ApiOperation({ summary: '取消关注指定用户（移动端）' })
  @ApiOkResponse({ description: '取消关注成功' })
  unfollow(
    @Param('targetUserId') targetUserId: string,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.socialService.unfollow(targetUserId, customerId);
  }

  @Post('messages')
  @ApiOperation({ summary: '发送留言或好友聊天消息（移动端）' })
  @ApiOkResponse({ description: '发送成功' })
  sendMessage(@Body() dto: SendCustomerMessageDto, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.sendMessage(dto, customerId);
  }

  @Get('messages/:userId')
  @ApiOperation({ summary: '分页查询与指定用户的会话消息（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findMessages(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.socialService.findMessages(userId, query, customerId);
  }
}
