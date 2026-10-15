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
import { AdsService } from './ads.service';
import { AdCampaignPageResponseDto } from './dto/ad-campaign-page-response.dto';
import { AdCampaignResponseDto } from './dto/ad-campaign-response.dto';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { DeleteAdCampaignResponseDto } from './dto/delete-ad-campaign-response.dto';
import { QueryAdCampaignDto } from './dto/query-ad-campaign.dto';
import { UpdateAdCampaignDto } from './dto/update-ad-campaign.dto';
import { UpdateAdStatusDto } from './dto/update-ad-status.dto';

@ApiTags('admin / ads')
@ApiBearerAuth()
@ApiExtraModels(AdCampaignResponseDto, AdCampaignPageResponseDto, DeleteAdCampaignResponseDto)
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @ApiOperation({ summary: '创建广告计划' })
  @ApiCreatedResponse(
    apiDataResponse(AdCampaignResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createAdCampaignDto: CreateAdCampaignDto) {
    return this.adsService.create(createAdCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询广告计划' })
  @ApiOkResponse(
    apiDataResponse(AdCampaignPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryAdCampaignDto: QueryAdCampaignDto) {
    return this.adsService.findAll(queryAdCampaignDto);
  }

  @Put('status')
  @ApiOperation({ summary: '更新广告状态，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(AdCampaignResponseDto, { description: '更新成功' }))
  updateStatus(@Body() updateAdStatusDto: UpdateAdStatusDto) {
    return this.adsService.updateStatus(updateAdStatusDto);
  }

  @Put()
  @ApiOperation({ summary: '更新广告计划，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(AdCampaignResponseDto, { description: '更新成功' }))
  update(@Body() updateAdCampaignDto: UpdateAdCampaignDto) {
    return this.adsService.update(updateAdCampaignDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询广告计划详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(AdCampaignResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adsService.findOne(String(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除广告计划' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(DeleteAdCampaignResponseDto, { description: '删除成功' }))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adsService.remove(String(id));
  }
}
