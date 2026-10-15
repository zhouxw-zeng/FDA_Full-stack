import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { AdminUser } from '../users/entities/admin-user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('public / auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '账号密码登录并签发 token' })
  @ApiOkResponse(apiDataResponse(AuthTokenResponseDto, { description: '登录成功' }))
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: '使用 refreshToken 刷新登录状态' })
  @ApiOkResponse(apiDataResponse(AuthTokenResponseDto, { description: '刷新成功' }))
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '注销当前 refreshToken 会话' })
  @ApiOkResponse(apiDataResponse(LogoutResponseDto, { description: '注销成功' }))
  logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户信息' })
  getProfile(@CurrentUser() user: AdminUser) {
    return this.authService.getProfile(user.id);
  }
}
