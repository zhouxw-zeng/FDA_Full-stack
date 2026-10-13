import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AdminUser } from '../users/entities/admin-user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminRole } from './entities/admin-role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(AdminRole)
    private readonly rolesRepository: Repository<AdminRole>,
    @InjectRepository(AdminUser)
    private readonly usersRepository: Repository<AdminUser>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    await this.ensureRoleNameUnique(createRoleDto.roleName);

    const role = this.rolesRepository.create(createRoleDto);
    return this.toResponse(await this.rolesRepository.save(role));
  }

  async findAll(queryRoleDto: QueryRoleDto) {
    const { page, pageSize, keyword } = queryRoleDto;
    const query = this.rolesRepository.createQueryBuilder('role');

    if (keyword) {
      query.andWhere('(role.roleName LIKE :keyword OR role.roleRemark LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await query
      .orderBy('role.roleId', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map((role) => this.toResponse(role)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(roleId: string) {
    return this.toResponse(await this.getRoleOrThrow(roleId));
  }

  async update(updateRoleDto: UpdateRoleDto) {
    const { id: roleId, ...changes } = updateRoleDto;
    const role = await this.getRoleOrThrow(roleId);

    if (updateRoleDto.roleName) {
      await this.ensureRoleNameUnique(updateRoleDto.roleName, roleId);
    }

    Object.assign(role, changes);
    return this.toResponse(await this.rolesRepository.save(role));
  }

  async remove(roleId: string) {
    const role = await this.getRoleOrThrow(roleId);
    const userCount = await this.usersRepository.countBy({ roleId });

    if (userCount > 0) {
      throw new ConflictException(`角色“${role.roleName}”已分配给 ${userCount} 个用户，不能删除`);
    }

    await this.rolesRepository.delete(roleId);
    return { success: true, roleId };
  }

  private async getRoleOrThrow(roleId: string): Promise<AdminRole> {
    const role = await this.rolesRepository.findOneBy({ roleId });

    if (!role) {
      throw new NotFoundException(`角色 ${roleId} 不存在`);
    }

    return role;
  }

  private async ensureRoleNameUnique(roleName: string, excludeRoleId?: string): Promise<void> {
    const role = await this.rolesRepository.findOne({
      where: {
        roleName,
        ...(excludeRoleId ? { roleId: Not(excludeRoleId) } : {}),
      },
      select: { roleId: true },
    });

    if (role) {
      throw new ConflictException(`角色名称“${roleName}”已存在`);
    }
  }

  private toResponse(role: AdminRole) {
    return {
      roleId: role.roleId,
      roleName: role.roleName,
      roleRemark: role.roleRemark,
      routeIdGroup: role.routeIdGroup,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
