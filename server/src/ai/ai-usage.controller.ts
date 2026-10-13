import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiUsageService } from './ai-usage.service';
import { QueryAiUsageDto } from './dto/query-ai-usage.dto';

@ApiTags('ai-usage')
@ApiBearerAuth()
@Controller('ai/usage')
export class AiUsageController {
  constructor(private readonly usageService: AiUsageService) {}

  @Get('records')
  @ApiOperation({ summary: '分页查询 AI 调用记录' })
  records(@Query() queryAiUsageDto: QueryAiUsageDto) {
    return this.usageService.findAll(queryAiUsageDto);
  }

  @Get('analysis')
  @ApiOperation({ summary: '统计 AI 用量趋势和总计' })
  analysis(@Query() queryAiUsageDto: QueryAiUsageDto) {
    return this.usageService.analyze(queryAiUsageDto);
  }
}
