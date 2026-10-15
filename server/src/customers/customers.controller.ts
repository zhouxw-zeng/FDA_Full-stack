import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { apiDataResponse } from '../common/swagger/api-data-response';
import { CurrentMobileCustomer } from '../mobile-auth/decorators/current-mobile-customer.decorator';
import { MobileAuthGuard } from '../mobile-auth/guards/mobile-auth.guard';
import { AdminUser } from '../users/entities/admin-user.entity';
import { CustomersService } from './customers.service';
import { AuditCustomerDto } from './dto/audit-customer.dto';
import { CustomerPageResponseDto } from './dto/customer-page-response.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';

@ApiTags('mobile / customers')
@ApiBearerAuth()
@ApiExtraModels(CustomerResponseDto, CustomerPageResponseDto)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: '分页查询 C 端用户' })
  @ApiOkResponse(apiDataResponse(CustomerPageResponseDto, { description: '查询成功' }))
  findAll(@Query() queryCustomerDto: QueryCustomerDto) {
    return this.customersService.findAll(queryCustomerDto);
  }

  @Get('me')
  @Public()
  @UseGuards(MobileAuthGuard)
  @ApiOperation({ summary: '获取当前 C 端用户信息' })
  getCurrentCustomer(@CurrentMobileCustomer() customerId: string) {
    return this.customersService.findOne(customerId);
  }

  @Put('audit')
  @ApiOperation({ summary: '审批 C 端用户，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(CustomerResponseDto, { description: '审批成功' }))
  audit(@Body() auditCustomerDto: AuditCustomerDto, @CurrentUser() operator: AdminUser) {
    return this.customersService.audit(auditCustomerDto, operator.id);
  }

  @Put('status')
  @ApiOperation({ summary: '启用或禁用 C 端用户，ID 从 Body 传入' })
  @ApiOkResponse(apiDataResponse(CustomerResponseDto, { description: '状态更新成功' }))
  updateStatus(@Body() updateCustomerStatusDto: UpdateCustomerStatusDto) {
    return this.customersService.updateStatus(updateCustomerStatusDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询 C 端用户详情' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse(apiDataResponse(CustomerResponseDto, { description: '查询成功' }))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(String(id));
  }
}
