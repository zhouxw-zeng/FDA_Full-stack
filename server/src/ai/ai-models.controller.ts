import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { AiModelsService } from './ai-models.service';
import { AiModelConfigPageResponseDto } from './dto/ai-model-config-page-response.dto';
import { AiModelConfigResponseDto } from './dto/ai-model-config-response.dto';
import { CreateAiModelConfigDto } from './dto/create-ai-model-config.dto';
import { QueryAiModelConfigDto } from './dto/query-ai-model-config.dto';
import { UpdateAiModelConfigDto } from './dto/update-ai-model-config.dto';

@ApiTags('admin / ai-models')
@ApiBearerAuth()
@ApiExtraModels(AiModelConfigResponseDto, AiModelConfigPageResponseDto)
@Controller('ai/models')
export class AiModelsController {
  constructor(private readonly modelsService: AiModelsService) {}

  @Post()
  @ApiOperation({ summary: '创建 AI 模型配置' })
  @ApiCreatedResponse(
    apiDataResponse(AiModelConfigResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createAiModelConfigDto: CreateAiModelConfigDto) {
    return this.modelsService.create(createAiModelConfigDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询 AI 模型配置' })
  @ApiOkResponse(
    apiDataResponse(AiModelConfigPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryAiModelConfigDto: QueryAiModelConfigDto) {
    return this.modelsService.findAll(queryAiModelConfigDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询 AI 模型配置详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(AiModelConfigResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新 AI 模型配置，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(AiModelConfigResponseDto, { description: '更新成功' }))
  update(@Body() updateAiModelConfigDto: UpdateAiModelConfigDto) {
    return this.modelsService.update(updateAiModelConfigDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 AI 模型配置' })
  @ApiParam({ name: 'id', example: 1 })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.remove(String(id));
  }
}
