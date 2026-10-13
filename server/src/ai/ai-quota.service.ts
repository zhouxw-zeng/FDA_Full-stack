import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';
import { RefreshAiQuotaDto } from './dto/refresh-ai-quota.dto';
import { UpdateAiQuotaDto } from './dto/update-ai-quota.dto';
import { AiQuotaAccount } from './entities/ai-quota-account.entity';

@Injectable()
export class AiQuotaService {
  constructor(
    @InjectRepository(AiQuotaAccount)
    private readonly quotaRepository: Repository<AiQuotaAccount>,
  ) {}

  async findAll(query: QueryAiUsageDto) {
    const { page, size, skip } = resolvePagination(query);
    const [list, total] = await this.quotaRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: size,
    });

    return createPaginationResult(
      list.map((quota) => this.toResponse(quota)),
      total,
      page,
      size,
    );
  }

  async update(updateAiQuotaDto: UpdateAiQuotaDto) {
    const { id, ...changes } = updateAiQuotaDto;
    const quota = await this.getQuotaOrThrow(id);
    Object.assign(quota, changes);
    this.updateNextRefreshAt(quota);
    return this.toResponse(await this.quotaRepository.save(quota));
  }

  async refresh(refreshAiQuotaDto: RefreshAiQuotaDto) {
    const quota = await this.getQuotaOrThrow(refreshAiQuotaDto.id);
    quota.usedAmount = 0;
    quota.lastRefreshedAt = new Date();
    this.updateNextRefreshAt(quota);
    return this.toResponse(await this.quotaRepository.save(quota));
  }

  async addUsage(providerCode: string, totalTokens: number): Promise<void> {
    if (totalTokens <= 0) {
      return;
    }

    let quota = await this.quotaRepository.findOneBy({ providerCode });
    if (!quota) {
      quota = this.quotaRepository.create({
        providerCode,
        quotaLimit: 0,
        usedAmount: 0,
        currency: 'TOKEN',
        refreshStrategy: 'manual',
        lastRefreshedAt: null,
        nextRefreshAt: null,
      });
      await this.quotaRepository.save(quota);
    }

    await this.quotaRepository.increment({ id: quota.id }, 'usedAmount', totalTokens);
  }

  private updateNextRefreshAt(quota: AiQuotaAccount): void {
    const now = new Date();
    quota.lastRefreshedAt = quota.lastRefreshedAt ?? null;

    if (quota.refreshStrategy === 'daily') {
      quota.nextRefreshAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return;
    }
    if (quota.refreshStrategy === 'monthly') {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      quota.nextRefreshAt = next;
      return;
    }

    quota.nextRefreshAt = null;
  }

  private async getQuotaOrThrow(id: string): Promise<AiQuotaAccount> {
    const quota = await this.quotaRepository.findOneBy({ id });

    if (!quota) {
      throw new NotFoundException(`AI 额度账户 ${id} 不存在`);
    }

    return quota;
  }

  private toResponse(quota: AiQuotaAccount) {
    const remaining =
      quota.quotaLimit <= 0 ? null : Math.max(0, quota.quotaLimit - quota.usedAmount);

    return {
      id: quota.id,
      providerCode: quota.providerCode,
      quotaLimit: quota.quotaLimit,
      usedAmount: quota.usedAmount,
      remainingAmount: remaining,
      currency: quota.currency,
      refreshStrategy: quota.refreshStrategy,
      lastRefreshedAt: quota.lastRefreshedAt,
      nextRefreshAt: quota.nextRefreshAt,
      createdAt: quota.createdAt,
      updatedAt: quota.updatedAt,
    };
  }
}
