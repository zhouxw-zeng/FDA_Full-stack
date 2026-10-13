import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiQuotaService } from './ai-quota.service';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';
import { RefreshAiQuotaDto } from './dto/refresh-ai-quota.dto';
import { UpdateAiQuotaDto } from './dto/update-ai-quota.dto';

@ApiTags('ai-quota')
@ApiBearerAuth()
@Controller('ai/quota')
export class AiQuotaController {
  constructor(private readonly quotaService: AiQuotaService) {}

  @Get()
  @ApiOperation({ summary: '查询 AI 额度账户' })
  findAll(@Query() query: QueryAiUsageDto) {
    return this.quotaService.findAll(query);
  }

  @Put()
  @ApiOperation({ summary: '更新 AI 额度配置，ID 从 Body 传入' })
  update(@Body() updateAiQuotaDto: UpdateAiQuotaDto) {
    return this.quotaService.update(updateAiQuotaDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 AI 额度' })
  refresh(@Body() refreshAiQuotaDto: RefreshAiQuotaDto) {
    return this.quotaService.refresh(refreshAiQuotaDto);
  }
}
