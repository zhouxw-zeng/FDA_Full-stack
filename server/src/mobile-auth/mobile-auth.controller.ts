import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentMobileCustomer } from './decorators/current-mobile-customer.decorator';
import { MobileUpdateProfileDto } from './dto/mobile-update-profile.dto';
import { MobileAuthGuard } from './guards/mobile-auth.guard';
import { MobileAuthService } from './mobile-auth.service';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { MobileRefreshTokenDto } from './dto/mobile-refresh-token.dto';

@ApiTags('mobile / auth')
@Controller('mobile-auth')
@Public()
export class MobileAuthController {
  constructor(private readonly mobileAuthService: MobileAuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '手机号密码登录，未注册时自动注册' })
  @ApiOkResponse({
    description: '登录成功、自动注册成功或密码校验失败',
  })
  login(@Body() loginDto: MobileLoginDto) {
    return this.mobileAuthService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '刷新移动端登录状态' })
  refresh(@Body() refreshTokenDto: MobileRefreshTokenDto) {
    return this.mobileAuthService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: '注销移动端登录状态' })
  logout(@Body() refreshTokenDto: MobileRefreshTokenDto) {
    return this.mobileAuthService.logout(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '获取当前移动端用户个人信息' })
  getProfile(@CurrentMobileCustomer() customerId: string) {
    return this.mobileAuthService.getProfile(customerId);
  }

  @Get('user-info')
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '获取当前移动端用户信息' })
  getUserInfo(@CurrentMobileCustomer() customerId: string) {
    return this.mobileAuthService.getUserInfo(customerId);
  }

  @Put('profile')
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '更新当前移动端用户个人信息' })
  updateProfile(
    @Body() updateProfileDto: MobileUpdateProfileDto,
    @CurrentMobileCustomer() customerId: string,
  ) {
    return this.mobileAuthService.updateProfile(customerId, updateProfileDto);
  }
}
