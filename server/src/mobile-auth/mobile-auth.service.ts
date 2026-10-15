import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { apiMessage } from '../common/response/api-message';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { MobileUpdateProfileDto } from './dto/mobile-update-profile.dto';
import { MobileTokenService } from './mobile-token.service';

@Injectable()
export class MobileAuthService {
  constructor(
    @InjectRepository(CustomerUser)
    private readonly customersRepository: Repository<CustomerUser>,
    private readonly mobileTokenService: MobileTokenService,
  ) {}

  async login(loginDto: MobileLoginDto) {
    const existingCustomer = await this.customersRepository
      .createQueryBuilder('customer')
      .addSelect('customer.passwordHash')
      .where('customer.phone = :phone', { phone: loginDto.phone })
      .getOne();

    if (!existingCustomer) {
      const customer = await this.registerCustomer(loginDto);
      const tokens = await this.mobileTokenService.issueTokenPair(customer.id);

      return apiMessage('用户注册账号成功', {
        ...tokens,
        profile: this.toProfile(customer),
      });
    }

    const passwordMatched =
      existingCustomer.passwordHash &&
      (await bcrypt.compare(loginDto.password, existingCustomer.passwordHash));

    if (!passwordMatched) {
      throw new UnauthorizedException('请确认账号或登录密码。');
    }

    const tokens = await this.mobileTokenService.issueTokenPair(existingCustomer.id);
    return apiMessage('登录成功', {
      ...tokens,
      profile: this.toProfile(existingCustomer),
    });
  }

  async refresh(refreshToken: string) {
    const { customerId, tokens } = await this.mobileTokenService.rotateRefreshToken(refreshToken);
    const customer = await this.customersRepository.findOneByOrFail({ id: customerId });

    return apiMessage('刷新成功', {
      ...tokens,
      profile: this.toProfile(customer),
    });
  }

  async logout(refreshToken: string) {
    await this.mobileTokenService.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  async getProfile(customerId: string) {
    return this.toProfile(await this.getCustomerOrFail(customerId));
  }

  async getUserInfo(customerId: string) {
    return this.toUserInfo(await this.getCustomerOrFail(customerId));
  }

  async updateProfile(customerId: string, dto: MobileUpdateProfileDto) {
    const customer = await this.getCustomerOrFail(customerId);

    if (dto.nickname !== undefined) {
      customer.nickname = dto.nickname;
    }
    if (dto.email !== undefined) {
      customer.email = dto.email || null;
    }
    if (dto.avatar !== undefined) {
      customer.avatar = dto.avatar || null;
    }
    if (dto.gender !== undefined) {
      customer.gender = dto.gender;
    }
    if (dto.birthday !== undefined) {
      customer.birthday = dto.birthday || null;
    }
    if (dto.region !== undefined) {
      customer.region = dto.region || null;
    }
    if (dto.signature !== undefined) {
      customer.signature = dto.signature || null;
    }

    return this.toProfile(await this.customersRepository.save(customer));
  }

  private async registerCustomer(loginDto: MobileLoginDto): Promise<CustomerUser> {
    const customer = this.customersRepository.create({
      username: loginDto.phone,
      nickname: `用户${loginDto.phone.slice(-4)}`,
      avatar: null,
      phone: loginDto.phone,
      passwordHash: await bcrypt.hash(loginDto.password, 12),
      email: null,
      gender: 0,
      birthday: null,
      region: null,
      signature: null,
      vipLevel: 1,
      auditStatus: 'approved',
      enabled: 1,
      auditRemark: '移动端注册自动通过',
      auditedAt: new Date(),
      auditedBy: null,
      dynamicCount: 0,
      lastLoginAt: new Date(),
    });

    return this.customersRepository.save(customer);
  }

  private async getCustomerOrFail(customerId: string): Promise<CustomerUser> {
    const customer = await this.customersRepository.findOneBy({ id: customerId });
    if (!customer) {
      throw new UnauthorizedException('当前用户不存在或已失效');
    }
    return customer;
  }

  private toProfile(customer: CustomerUser) {
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
      createdAt: customer.createdAt,
    };
  }

  private toUserInfo(customer: CustomerUser) {
    return {
      ...this.toProfile(customer),
      auditRemark: customer.auditRemark,
      auditedAt: customer.auditedAt,
      dynamicCount: customer.dynamicCount,
      lastLoginAt: customer.lastLoginAt,
      updatedAt: customer.updatedAt,
    };
  }
}
