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
import { AdPartnerTypesService } from './ad-partner-types.service';
import { AdPartnerTypePageResponseDto } from './dto/ad-partner-type-page-response.dto';
import { AdPartnerTypeResponseDto } from './dto/ad-partner-type-response.dto';
import { CreateAdPartnerTypeDto } from './dto/create-ad-partner-type.dto';
import { DeleteAdPartnerTypeResponseDto } from './dto/delete-ad-partner-type-response.dto';
import { QueryAdPartnerTypeDto } from './dto/query-ad-partner-type.dto';
import { UpdateAdPartnerTypeDto } from './dto/update-ad-partner-type.dto';

@ApiTags('ads-partner-types')
@ApiBearerAuth()
@ApiExtraModels(
  AdPartnerTypeResponseDto,
  AdPartnerTypePageResponseDto,
  DeleteAdPartnerTypeResponseDto,
)
@Controller('ads/partner-types')
export class AdPartnerTypesController {
  constructor(private readonly partnerTypesService: AdPartnerTypesService) {}

  @Post()
  @ApiOperation({ summary: '创建广告对接方类型' })
  @ApiCreatedResponse(
    apiDataResponse(AdPartnerTypeResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createAdPartnerTypeDto: CreateAdPartnerTypeDto) {
    return this.partnerTypesService.create(createAdPartnerTypeDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询广告对接方类型' })
  @ApiOkResponse(
    apiDataResponse(AdPartnerTypePageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryAdPartnerTypeDto: QueryAdPartnerTypeDto) {
    return this.partnerTypesService.findAll(queryAdPartnerTypeDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询广告对接方类型详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(AdPartnerTypeResponseDto, {
      description: '查询成功',
    }),
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnerTypesService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新广告对接方类型，ID 从 Body 传入' })
  @ApiOkResponse(
    apiDataResponse(AdPartnerTypeResponseDto, {
      description: '更新成功',
    }),
  )
  update(@Body() updateAdPartnerTypeDto: UpdateAdPartnerTypeDto) {
    return this.partnerTypesService.update(updateAdPartnerTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除广告对接方类型' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(DeleteAdPartnerTypeResponseDto, {
      description: '删除成功',
    }),
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partnerTypesService.remove(String(id));
  }
}
