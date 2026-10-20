import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { FollowCustomerDto } from './dto/follow-customer.dto';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { PinConversationDto } from './dto/pin-conversation.dto';
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

  @Get('users/:userId')
  @ApiOperation({ summary: '查询指定用户资料与关注状态（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findUser(@Param('userId') userId: string, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.findUser(userId, customerId);
  }

  @Get('users/:userId/dynamics')
  @ApiOperation({ summary: '分页查询指定用户已发布的动态（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findUserDynamics(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.socialService.findUserDynamics(userId, query, customerId);
  }

  @Get('stats')
  @ApiOperation({ summary: '查询当前用户关注、粉丝与动态数量（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  getStats(@CurrentMobileCustomer() customerId: string) {
    return this.socialService.getStats(customerId);
  }

  @Get('conversations')
  @ApiOperation({ summary: '分页查询当前用户的一对一会话（移动端）' })
  @ApiOkResponse({ description: '查询成功' })
  findConversations(
    @Query() query: PaginationQueryDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.socialService.findConversations(query, customerId);
  }

  @Post('conversations')
  @ApiOperation({ summary: '创建或获取与指定用户的一对一会话（移动端）' })
  @ApiOkResponse({ description: '操作成功' })
  openConversation(@Body() dto: OpenConversationDto, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.openConversation(dto.targetUserId, customerId);
  }

  @Put('conversations/:id/pin')
  @ApiOperation({ summary: '置顶或取消置顶当前用户会话（移动端）' })
  @ApiOkResponse({ description: '操作成功' })
  pinConversation(
    @Param('id') id: string,
    @Body() dto: PinConversationDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.socialService.pinConversation(id, dto, customerId);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: '从当前用户聊天列表删除会话（移动端）' })
  @ApiOkResponse({ description: '删除成功' })
  removeConversation(@Param('id') id: string, @CurrentMobileCustomer() customerId: string) {
    return this.socialService.removeConversation(id, customerId);
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
