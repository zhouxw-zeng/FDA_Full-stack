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
import { CreateRouteDto } from './dto/create-route.dto';
import { DeleteRouteResponseDto } from './dto/delete-route-response.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { RoutePageResponseDto } from './dto/route-page-response.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { RouteTreeResponseDto } from './dto/route-tree-response.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';

@ApiTags('routes')
@ApiBearerAuth()
@ApiExtraModels(RouteResponseDto, RouteTreeResponseDto, DeleteRouteResponseDto)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: '创建路由' })
  @ApiCreatedResponse(
    apiDataResponse(RouteResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询扁平路由列表' })
  @ApiOkResponse(apiDataResponse(RoutePageResponseDto, { description: '查询成功' }))
  findAll(@Query() queryRouteDto: QueryRouteDto) {
    return this.routesService.findAll(queryRouteDto);
  }

  @Get('tree')
  @ApiOperation({ summary: '查询树形路由列表' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: 'ok' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RouteTreeResponseDto' },
        },
      },
    },
  })
  findTree() {
    return this.routesService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询路由详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(RouteResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新路由，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(RouteResponseDto, { description: '更新成功' }))
  update(@Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(updateRouteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除路由' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(DeleteRouteResponseDto, { description: '删除成功' }))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.remove(String(id));
  }
}
