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
import { CreateDynamicTypeDto } from './dto/create-dynamic-type.dto';
import { DeleteDynamicTypeResponseDto } from './dto/delete-dynamic-type-response.dto';
import { DynamicTypePageResponseDto } from './dto/dynamic-type-page-response.dto';
import { DynamicTypeResponseDto } from './dto/dynamic-type-response.dto';
import { QueryDynamicTypeDto } from './dto/query-dynamic-type.dto';
import { UpdateDynamicTypeDto } from './dto/update-dynamic-type.dto';
import { ForumDynamicTypesService } from './forum-dynamic-types.service';

@ApiTags('admin / forum-dynamic-types')
@ApiBearerAuth()
@ApiExtraModels(DynamicTypeResponseDto, DynamicTypePageResponseDto, DeleteDynamicTypeResponseDto)
@Controller('forum/dynamic-types')
export class ForumDynamicTypesController {
  constructor(private readonly typesService: ForumDynamicTypesService) {}

  @Post()
  @ApiOperation({ summary: '创建动态类型' })
  @ApiCreatedResponse(
    apiDataResponse(DynamicTypeResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createDynamicTypeDto: CreateDynamicTypeDto) {
    return this.typesService.create(createDynamicTypeDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询动态类型' })
  @ApiOkResponse(
    apiDataResponse(DynamicTypePageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryDynamicTypeDto: QueryDynamicTypeDto) {
    return this.typesService.findAll(queryDynamicTypeDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询动态类型详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(DynamicTypeResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新动态类型，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(DynamicTypeResponseDto, { description: '更新成功' }))
  update(@Body() updateDynamicTypeDto: UpdateDynamicTypeDto) {
    return this.typesService.update(updateDynamicTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除动态类型' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(DeleteDynamicTypeResponseDto, {
      description: '删除成功',
    }),
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.remove(String(id));
  }
}
