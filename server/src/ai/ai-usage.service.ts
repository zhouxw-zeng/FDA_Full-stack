import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';
import { AiUsageRecord } from './entities/ai-usage-record.entity';

export interface UsageRecordInput {
  modelConfigId: string | null;
  providerCode: string;
  modelName: string;
  scene: string;
  requestId?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  adminUserId?: string;
  customerId?: string;
}

@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsageRecord)
    private readonly usageRepository: Repository<AiUsageRecord>,
  ) {}

  async record(input: UsageRecordInput) {
    const record = this.usageRepository.create({
      ...input,
      requestId: input.requestId ?? null,
      errorMessage: input.errorMessage ?? null,
      adminUserId: input.adminUserId ?? null,
      customerId: input.customerId ?? null,
    });

    return this.usageRepository.save(record);
  }

  async findAll(queryAiUsageDto: QueryAiUsageDto) {
    const { providerCode, modelName, status, startDate, endDate } = queryAiUsageDto;
    const { page, size, skip } = resolvePagination(queryAiUsageDto);
    const query = this.usageRepository.createQueryBuilder('usage');

    if (providerCode) {
      query.andWhere('usage.providerCode = :providerCode', { providerCode });
    }
    if (modelName) {
      query.andWhere('usage.modelName = :modelName', { modelName });
    }
    if (status) {
      query.andWhere('usage.status = :status', { status });
    }
    if (startDate) {
      query.andWhere('usage.createdAt >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }
    if (endDate) {
      query.andWhere('usage.createdAt <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    const [list, total] = await query
      .orderBy('usage.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((record) => ({
        id: record.id,
        modelConfigId: record.modelConfigId,
        providerCode: record.providerCode,
        modelName: record.modelName,
        scene: record.scene,
        requestId: record.requestId,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        latencyMs: record.latencyMs,
        status: record.status,
        errorMessage: record.errorMessage,
        customerId: record.customerId,
        createdAt: record.createdAt,
      })),
      total,
      page,
      size,
    );
  }

  async analyze(queryAiUsageDto: QueryAiUsageDto) {
    const { providerCode, modelName, startDate, endDate } = queryAiUsageDto;
    const query = this.usageRepository.createQueryBuilder('usage');

    if (providerCode) {
      query.andWhere('usage.providerCode = :providerCode', { providerCode });
    }
    if (modelName) {
      query.andWhere('usage.modelName = :modelName', { modelName });
    }
    if (startDate) {
      query.andWhere('usage.createdAt >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }
    if (endDate) {
      query.andWhere('usage.createdAt <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    const totals = await query
      .clone()
      .select('COUNT(*)', 'requests')
      .addSelect(
        "COALESCE(SUM(CASE WHEN usage.status = 'success' THEN 1 ELSE 0 END), 0)",
        'successRequests',
      )
      .addSelect('COALESCE(SUM(usage.promptTokens), 0)', 'promptTokens')
      .addSelect('COALESCE(SUM(usage.completionTokens), 0)', 'completionTokens')
      .addSelect('COALESCE(SUM(usage.totalTokens), 0)', 'totalTokens')
      .addSelect('COALESCE(AVG(usage.latencyMs), 0)', 'avgLatencyMs')
      .getRawOne<{
        requests: string;
        successRequests: string;
        promptTokens: string;
        completionTokens: string;
        totalTokens: string;
        avgLatencyMs: string;
      }>();

    const series = await query
      .clone()
      .select('DATE(usage.createdAt)', 'date')
      .addSelect('COUNT(*)', 'requests')
      .addSelect('COALESCE(SUM(usage.totalTokens), 0)', 'totalTokens')
      .groupBy('DATE(usage.createdAt)')
      .orderBy('DATE(usage.createdAt)', 'ASC')
      .getRawMany<{ date: string; requests: string; totalTokens: string }>();

    return {
      totals: {
        requests: Number(totals?.requests ?? 0),
        successRequests: Number(totals?.successRequests ?? 0),
        promptTokens: Number(totals?.promptTokens ?? 0),
        completionTokens: Number(totals?.completionTokens ?? 0),
        totalTokens: Number(totals?.totalTokens ?? 0),
        avgLatencyMs: Number(totals?.avgLatencyMs ?? 0),
      },
      series: series.map((item) => ({
        date: item.date,
        requests: Number(item.requests),
        totalTokens: Number(item.totalTokens),
      })),
    };
  }
}
