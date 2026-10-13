import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { AuthToken } from '../entities/auth-token.entity';

const ACCESS_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly tokensRepository: Repository<AuthToken>,
  ) {}

  /**
   * 登录成功后生成 accessToken/refreshToken。
   * 原始 token 只返回给客户端，数据库仅保存不可逆哈希。
   */
  async issueTokenPair(userId: string): Promise<TokenPair> {
    const accessToken = randomBytes(32).toString('hex');
    const refreshToken = randomBytes(32).toString('hex');
    const now = Date.now();
    const accessExpiresAt = new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000);
    const refreshExpiresAt = new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000);

    const token = this.tokensRepository.create({
      userId,
      accessTokenHash: this.hashToken(accessToken),
      refreshTokenHash: this.hashToken(refreshToken),
      accessExpiresAt,
      refreshExpiresAt,
      lastUsedAt: now > 0 ? new Date(now) : null,
      revokedAt: null,
    });
    await this.tokensRepository.save(token);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * 校验 Bearer accessToken。
   * 验证通过后返回用户及角色信息，供后续接口和 CurrentUser 装饰器使用。
   */
  async validateAccessToken(accessToken: string): Promise<AdminUser> {
    const token = await this.tokensRepository.findOne({
      where: {
        accessTokenHash: this.hashToken(accessToken),
      },
      relations: {
        user: {
          role: true,
        },
      },
    });

    if (
      !token ||
      token.revokedAt ||
      token.accessExpiresAt.getTime() <= Date.now() ||
      !token.user ||
      token.user.status !== 1
    ) {
      throw new UnauthorizedException('Token 无效或已过期');
    }

    if (
      !token.lastUsedAt ||
      Date.now() - token.lastUsedAt.getTime() >= LAST_USED_UPDATE_INTERVAL_MS
    ) {
      await this.tokensRepository.update(token.id, { lastUsedAt: new Date() });
    }

    return token.user;
  }

  /**
   * 使用 refreshToken 换取新 token。
   * 旧 refreshToken 会立即失效，避免重复使用。
   */
  async rotateRefreshToken(refreshToken: string): Promise<{
    tokens: TokenPair;
    user: AdminUser;
  }> {
    const token = await this.tokensRepository.findOne({
      where: {
        refreshTokenHash: this.hashToken(refreshToken),
      },
      relations: {
        user: {
          role: true,
        },
      },
    });

    if (
      !token ||
      token.revokedAt ||
      token.refreshExpiresAt.getTime() <= Date.now() ||
      !token.user ||
      token.user.status !== 1
    ) {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    await this.tokensRepository.update(token.id, { revokedAt: new Date() });
    const tokens = await this.issueTokenPair(token.userId);
    return { tokens, user: token.user };
  }

  /**
   * 注销当前 refreshToken 对应的登录会话。
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.tokensRepository.update(
      { refreshTokenHash: this.hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
