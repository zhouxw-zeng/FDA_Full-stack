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
import { CreateRoleDto } from './dto/create-role.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { RolePageResponseDto } from './dto/role-page-response.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('admin / roles')
@ApiBearerAuth()
@ApiExtraModels(RoleResponseDto, RolePageResponseDto, DeleteRoleResponseDto)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiCreatedResponse(
    apiDataResponse(RoleResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询角色' })
  @ApiOkResponse(apiDataResponse(RolePageResponseDto, { description: '查询成功' }))
  findAll(@Query() queryRoleDto: QueryRoleDto) {
    return this.rolesService.findAll(queryRoleDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询角色详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(RoleResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(String(id));
  }

  @Put()
  @ApiOperation({ summary: '更新角色，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(RoleResponseDto, { description: '更新成功' }))
  update(@Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(DeleteRoleResponseDto, { description: '删除成功' }))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(String(id));
  }
}
