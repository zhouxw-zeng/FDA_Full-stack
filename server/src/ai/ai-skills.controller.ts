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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { AiSkillsService, UploadedMarkdownFile } from './ai-skills.service';
import { AiSkillPageResponseDto } from './dto/ai-skill-page-response.dto';
import { AiSkillResponseDto } from './dto/ai-skill-response.dto';
import { CreateAiSkillDto } from './dto/create-ai-skill.dto';
import { QueryAiSkillDto } from './dto/query-ai-skill.dto';
import { UpdateAiSkillDto } from './dto/update-ai-skill.dto';

@ApiTags('ai-skills')
@ApiBearerAuth()
@ApiExtraModels(AiSkillResponseDto, AiSkillPageResponseDto)
@Controller('ai/skills')
export class AiSkillsController {
  constructor(private readonly skillsService: AiSkillsService) {}

  @Post()
  @ApiOperation({ summary: '创建 AI 技能' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skillName: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['skillName', 'file'],
    },
  })
  // 默认字符集是 latin1，中文文件名会变成乱码，这里显式按 utf8 解析
  @UseInterceptors(FileInterceptor('file', { defParamCharset: 'utf8' }))
  @ApiCreatedResponse(
    apiDataResponse(AiSkillResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createAiSkillDto: CreateAiSkillDto, @UploadedFile() file?: UploadedMarkdownFile) {
    return this.skillsService.create(createAiSkillDto, file);
  }

  @Get()
  @ApiOperation({ summary: '分页查询 AI 技能' })
  @ApiOkResponse(
    apiDataResponse(AiSkillPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryAiSkillDto: QueryAiSkillDto) {
    return this.skillsService.findAll(queryAiSkillDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询 AI 技能详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(AiSkillResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillsService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新 AI 技能，ID 从 Body 传入' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        skillName: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['id'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { defParamCharset: 'utf8' }))
  @ApiOkResponse(apiDataResponse(AiSkillResponseDto, { description: '更新成功' }))
  update(@Body() updateAiSkillDto: UpdateAiSkillDto, @UploadedFile() file?: UploadedMarkdownFile) {
    return this.skillsService.update(updateAiSkillDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 AI 技能' })
  @ApiParam({ name: 'id', example: 1 })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.skillsService.remove(String(id));
  }
}
