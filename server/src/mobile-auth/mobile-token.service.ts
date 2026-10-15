import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { CustomerAuthToken } from './entities/customer-auth-token.entity';

const ACCESS_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_MAX_TOKENS_PER_USER = 5;

export interface MobileTokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

@Injectable()
export class MobileTokenService {
  constructor(
    @InjectRepository(CustomerAuthToken)
    private readonly tokensRepository: Repository<CustomerAuthToken>,
    private readonly configService: ConfigService,
  ) {}

  async issueTokenPair(customerId: string): Promise<MobileTokenPair> {
    const accessToken = randomBytes(32).toString('hex');
    const refreshToken = randomBytes(32).toString('hex');
    const accessExpiresIn = ACCESS_TOKEN_TTL_SECONDS;
    const refreshExpiresIn = REFRESH_TOKEN_TTL_SECONDS;

    await this.tokensRepository.save(
      this.tokensRepository.create({
        customerId,
        accessTokenHash: this.hashToken(accessToken),
        refreshTokenHash: this.hashToken(refreshToken),
        accessExpiresAt: new Date(Date.now() + accessExpiresIn * 1000),
        refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
        lastUsedAt: new Date(),
        revokedAt: null,
      }),
    );
    await this.enforceTokenLimit(customerId);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn,
      refreshExpiresIn,
    };
  }

  async rotateRefreshToken(refreshToken: string): Promise<{
    customerId: string;
    tokens: MobileTokenPair;
  }> {
    const token = await this.tokensRepository.findOneBy({
      refreshTokenHash: this.hashToken(refreshToken),
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    if (token.revokedAt || token.refreshExpiresAt.getTime() <= Date.now()) {
      await this.tokensRepository.delete(token.id);
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    await this.tokensRepository.delete(token.id);
    return {
      customerId: token.customerId,
      tokens: await this.issueTokenPair(token.customerId),
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.tokensRepository.delete({
      refreshTokenHash: this.hashToken(refreshToken),
    });
  }

  async validateAccessToken(accessToken: string): Promise<string> {
    const token = await this.tokensRepository.findOneBy({
      accessTokenHash: this.hashToken(accessToken),
    });

    if (!token || token.revokedAt || token.accessExpiresAt.getTime() <= Date.now()) {
      if (token) {
        await this.tokensRepository.delete(token.id);
      }
      throw new UnauthorizedException('Access Token 无效或已过期');
    }

    if (!token.lastUsedAt || Date.now() - token.lastUsedAt.getTime() >= 5 * 60 * 1000) {
      await this.tokensRepository.update(token.id, { lastUsedAt: new Date() });
    }

    return token.customerId;
  }

  private async enforceTokenLimit(customerId: string): Promise<void> {
    await this.cleanupExpiredTokens(customerId);

    const maxTokens = this.getMaxTokensPerUser();
    const activeTokens = await this.tokensRepository.find({
      where: {
        customerId,
        revokedAt: IsNull(),
        refreshExpiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    if (activeTokens.length > maxTokens) {
      await this.tokensRepository.remove(activeTokens.slice(0, activeTokens.length - maxTokens));
    }
  }

  private async cleanupExpiredTokens(customerId: string): Promise<void> {
    await this.tokensRepository
      .createQueryBuilder()
      .delete()
      .from(CustomerAuthToken)
      .where('customer_id = :customerId', { customerId })
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
