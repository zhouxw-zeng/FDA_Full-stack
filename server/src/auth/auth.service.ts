import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsernameWithPassword(loginDto.username);
    const passwordMatched = user
      ? await bcrypt.compare(loginDto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatched) {
      throw new UnauthorizedException('账号或密码不正确');
    }

    if (user.status !== 1) {
      throw new ForbiddenException('账号已被禁用');
    }

    const tokens = await this.tokenService.issueTokenPair(user.id);
    await this.usersService.markLastLogin(user.id);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const { tokens, user } = await this.tokenService.rotateRefreshToken(refreshToken);
    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async logout(refreshToken: string) {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  private toAuthUser(user: {
    id: string;
    username: string;
    nickname: string;
    email: string;
    avatar: string | null;
    department: string | null;
    bio: string | null;
    roleId: string;
    role: { roleName: string; routeIdGroup: number[] };
  }): AuthUserDto {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      department: user.department,
      bio: user.bio,
      roleId: user.roleId,
      roleName: user.role.roleName,
      routeIdGroup: user.role.routeIdGroup,
    };
  }
}
