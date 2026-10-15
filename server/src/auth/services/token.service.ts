import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { AuthToken } from '../entities/auth-token.entity';

const ACCESS_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_TOKENS_PER_USER = 5;

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
    private readonly configService: ConfigService,
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
    await this.enforceTokenLimit(userId);

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

    if (!token) {
      throw new UnauthorizedException('Token 无效或已过期');
    }

    if (
      token.revokedAt ||
      token.refreshExpiresAt.getTime() <= Date.now() ||
      !token.user ||
      token.user.status !== 1
    ) {
      await this.tokensRepository.delete(token.id);
      throw new UnauthorizedException('Token 无效或已过期');
    }

    if (token.accessExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Token 已过期');
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

    if (!token) {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    if (
      token.revokedAt ||
      token.refreshExpiresAt.getTime() <= Date.now() ||
      !token.user ||
      token.user.status !== 1
    ) {
      await this.tokensRepository.delete(token.id);
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    await this.tokensRepository.delete(token.id);
    const tokens = await this.issueTokenPair(token.userId);
    return { tokens, user: token.user };
  }

  /**
   * 注销当前 refreshToken 对应的登录会话。
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.tokensRepository.delete({
      refreshTokenHash: this.hashToken(refreshToken),
    });
  }

  private async enforceTokenLimit(userId: string): Promise<void> {
    await this.cleanupExpiredTokens(userId);

    const maxTokens = this.getMaxTokensPerUser();
    const activeTokens = await this.tokensRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
        refreshExpiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    if (activeTokens.length > maxTokens) {
      await this.tokensRepository.remove(activeTokens.slice(0, activeTokens.length - maxTokens));
    }
  }

  private async cleanupExpiredTokens(userId: string): Promise<void> {
    await this.tokensRepository
      .createQueryBuilder()
      .delete()
      .from(AuthToken)
      .where('user_id = :userId', { userId })
      .andWhere('(revoked_at IS NOT NULL OR refresh_expires_at <= :now)', {
        now: new Date(),
      })
      .execute();
  }

  private getMaxTokensPerUser(): number {
    const configured = Number(
      this.configService.get<string>(
        'AUTH_MAX_TOKENS_PER_USER',
        String(DEFAULT_MAX_TOKENS_PER_USER),
      ),
    );

    return Number.isInteger(configured) && configured > 0
      ? configured
      : DEFAULT_MAX_TOKENS_PER_USER;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
