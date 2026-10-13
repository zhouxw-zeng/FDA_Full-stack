import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { AuditCustomerDto } from './dto/audit-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { CustomerUser } from './entities/customer-user.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerUser)
    private readonly customersRepository: Repository<CustomerUser>,
  ) {}

  async findAll(queryCustomerDto: QueryCustomerDto) {
    const { keyword, auditStatus, enabled, vipLevel } = queryCustomerDto;
    const { page, size, skip } = resolvePagination(queryCustomerDto);
    const query = this.customersRepository.createQueryBuilder('customer');

    if (keyword) {
      query.andWhere(
        '(customer.username LIKE :keyword OR customer.nickname LIKE :keyword OR customer.phone LIKE :keyword OR customer.email LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (auditStatus !== undefined) {
      query.andWhere('customer.auditStatus = :auditStatus', { auditStatus });
    }
    if (enabled !== undefined) {
      query.andWhere('customer.enabled = :enabled', { enabled });
    }
    if (vipLevel !== undefined) {
      query.andWhere('customer.vipLevel = :vipLevel', { vipLevel });
    }

    const [list, total] = await query
      .orderBy('customer.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((customer) => this.toResponse(customer)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    return this.toResponse(await this.getCustomerOrThrow(id));
  }

  async audit(auditCustomerDto: AuditCustomerDto, operatorId: string) {
    const customer = await this.getCustomerOrThrow(auditCustomerDto.id);

    customer.auditStatus = auditCustomerDto.status;
    customer.auditRemark = auditCustomerDto.remark ?? null;
    customer.auditedAt = new Date();
    customer.auditedBy = operatorId;
    customer.enabled = auditCustomerDto.status === 'approved' ? 1 : 0;

    return this.toResponse(await this.customersRepository.save(customer));
  }

  async updateStatus(updateCustomerStatusDto: UpdateCustomerStatusDto) {
    const customer = await this.getCustomerOrThrow(updateCustomerStatusDto.id);

    if (updateCustomerStatusDto.enabled === 1 && customer.auditStatus !== 'approved') {
      throw new ConflictException('只有审批通过的用户才能启用');
    }

    customer.enabled = updateCustomerStatusDto.enabled;
    return this.toResponse(await this.customersRepository.save(customer));
  }

  private async getCustomerOrThrow(id: string): Promise<CustomerUser> {
    const customer = await this.customersRepository.findOneBy({ id });

    if (!customer) {
      throw new NotFoundException(`C 端用户 ${id} 不存在`);
    }

    return customer;
  }

  private toResponse(customer: CustomerUser) {
    return {
      id: customer.id,
      username: customer.username,
      nickname: customer.nickname,
      avatar: customer.avatar,
      phone: customer.phone,
      email: customer.email,
      gender: customer.gender,
      birthday: customer.birthday,
      region: customer.region,
      signature: customer.signature,
      vipLevel: customer.vipLevel,
      auditStatus: customer.auditStatus,
      enabled: customer.enabled,
      auditRemark: customer.auditRemark,
      auditedAt: customer.auditedAt,
      auditedBy: customer.auditedBy,
      dynamicCount: customer.dynamicCount,
      lastLoginAt: customer.lastLoginAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
