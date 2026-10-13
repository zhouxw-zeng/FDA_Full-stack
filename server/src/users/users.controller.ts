import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserResponseDto } from './dto/delete-user-response.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPageResponseDto } from './dto/user-page-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiExtraModels(UserResponseDto, UserPageResponseDto, DeleteUserResponseDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiCreatedResponse(
    apiDataResponse(UserResponseDto, {
      status: 201,
      description: '创建成功',
    }),
  )
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '分页查询用户' })
  @ApiOkResponse(
    apiDataResponse(UserPageResponseDto, {
      description: '查询成功',
    }),
  )
  findAll(@Query() queryUserDto: QueryUserDto) {
    return this.usersService.findAll(queryUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(UserResponseDto, {
      description: '查询成功',
    }),
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(String(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(UserResponseDto, {
      description: '更新成功',
    }),
  )
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(String(id), updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(
    apiDataResponse(DeleteUserResponseDto, {
      description: '删除成功',
    }),
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(String(id));
  }
}
