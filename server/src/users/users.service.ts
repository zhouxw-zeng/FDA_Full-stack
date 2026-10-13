import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { AdminRole } from '../roles/entities/admin-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUser } from './entities/admin-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly usersRepository: Repository<AdminUser>,
    @InjectRepository(AdminRole)
    private readonly rolesRepository: Repository<AdminRole>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.ensureUnique(createUserDto.username, createUserDto.email);
    const role = await this.getRoleOrThrow(createUserDto.roleId);

    const { password, ...profile } = createUserDto;
    const user = this.usersRepository.create({
      ...profile,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    });

    return this.toResponse(await this.usersRepository.save(user));
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { keyword } = queryUserDto;
    const { page, size, skip } = resolvePagination(queryUserDto);
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (keyword) {
      query.andWhere(
        '(user.username LIKE :keyword OR user.nickname LIKE :keyword OR user.email LIKE :keyword OR user.phone LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [list, total] = await query
      .orderBy('user.id', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((user) => this.toResponse(user)),
      total,
      page,
      size,
    );
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    return this.toResponse(user);
  }

  async update(updateUserDto: UpdateUserDto) {
    const { id: userId, password, ...profile } = updateUserDto;
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`);
    }

    await this.ensureUnique(updateUserDto.username, updateUserDto.email, userId);

    Object.assign(user, profile);

    if (updateUserDto.roleId) {
      user.role = await this.getRoleOrThrow(updateUserDto.roleId);
      user.roleId = user.role.roleId;
    }

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    return this.toResponse(await this.usersRepository.save(user));
  }

  async remove(id: string) {
    const result = await this.usersRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    return { success: true, id };
  }

  async findByUsernameWithPassword(username: string): Promise<AdminUser | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.username = :username', { username })
      .getOne();
  }

  async markLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  private async getRoleOrThrow(roleId: string): Promise<AdminRole> {
    const role = await this.rolesRepository.findOneBy({ roleId });

    if (!role) {
      throw new NotFoundException(`角色 ${roleId} 不存在`);
    }

    return role;
  }

  private async ensureUnique(username?: string, email?: string, excludeId?: string) {
    const conditions: FindOptionsWhere<AdminUser>[] = [];

    if (username) {
      conditions.push({
        username,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      });
    }

    if (email) {
      conditions.push({
        email,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      });
    }

    if (conditions.length === 0) {
      return;
    }

    const existingUser = await this.usersRepository.findOne({
      where: conditions,
      select: { id: true, username: true, email: true },
    });

    if (existingUser) {
      const field = username && existingUser.username === username ? 'username' : 'email';
      throw new ConflictException(`${field} 已存在`);
    }
  }

  private toResponse(user: AdminUser) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      department: user.department,
      bio: user.bio,
      roleId: user.roleId,
      roleName: user.role?.roleName ?? '',
      routeIdGroup: user.role?.routeIdGroup ?? [],
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
