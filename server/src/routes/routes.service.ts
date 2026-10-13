import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { createPaginationResult, resolvePagination } from '../common/pagination/pagination';
import { AdminRole } from '../roles/entities/admin-role.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { RouteTreeResponseDto } from './dto/route-tree-response.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { AdminRoute } from './entities/admin-route.entity';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(AdminRoute)
    private readonly routesRepository: Repository<AdminRoute>,
    @InjectRepository(AdminRole)
    private readonly rolesRepository: Repository<AdminRole>,
  ) {}

  async create(createRouteDto: CreateRouteDto) {
    await this.ensureUnique(createRouteDto.routeName, createRouteDto.routePath);
    await this.ensureParentExists(createRouteDto.pid);

    const route = this.routesRepository.create({
      ...createRouteDto,
      pid:
        createRouteDto.pid === undefined || createRouteDto.pid === null
          ? null
          : String(createRouteDto.pid),
    });

    return this.toResponse(await this.routesRepository.save(route));
  }

  async findTree(): Promise<RouteTreeResponseDto[]> {
    const routes = await this.routesRepository.find({
      order: { routeId: 'ASC' },
    });
    const nodeMap = new Map<string, RouteTreeResponseDto>();
    const roots: RouteTreeResponseDto[] = [];

    for (const route of routes) {
      nodeMap.set(route.routeId, {
        ...this.toResponse(route),
        children: [],
      });
    }

    for (const route of routes) {
      const node = nodeMap.get(route.routeId);
      const parent = route.pid ? nodeMap.get(route.pid) : undefined;

      if (!node) {
        continue;
      }

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findAll(queryRouteDto: QueryRouteDto) {
    const { keyword, status, routeType } = queryRouteDto;
    const { page, size, skip } = resolvePagination(queryRouteDto);
    const query = this.routesRepository.createQueryBuilder('route');

    if (keyword) {
      query.andWhere(
        '(route.routeName LIKE :keyword OR route.routePath LIKE :keyword OR route.componentPath LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status !== undefined) {
      query.andWhere('route.status = :status', { status });
    }
    if (routeType !== undefined) {
      query.andWhere('route.routeType = :routeType', { routeType });
    }

    const [list, total] = await query
      .orderBy('route.routeId', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return createPaginationResult(
      list.map((route) => this.toResponse(route)),
      total,
      page,
      size,
    );
  }

  async findOne(routeId: string) {
    return this.toResponse(await this.getRouteOrThrow(routeId));
  }

  async update(updateRouteDto: UpdateRouteDto) {
    const routeId = String(updateRouteDto.id);
    const route = await this.getRouteOrThrow(routeId);

    await this.ensureUnique(updateRouteDto.routeName, updateRouteDto.routePath, routeId);

    if (updateRouteDto.pid !== undefined) {
      if (updateRouteDto.pid === null) {
        route.pid = null;
      } else {
        const parentId = String(updateRouteDto.pid);

        if (parentId === routeId) {
          throw new BadRequestException('路由不能将自身设置为父路由');
        }

        await this.ensureParentExists(updateRouteDto.pid);
        await this.ensureNoCycle(routeId, parentId);
        route.pid = parentId;
      }
    }

    if (updateRouteDto.routeName !== undefined) {
      route.routeName = updateRouteDto.routeName;
    }
    if (updateRouteDto.icon !== undefined) {
      route.icon = updateRouteDto.icon;
    }
    if (updateRouteDto.routePath !== undefined) {
      route.routePath = updateRouteDto.routePath;
    }
    if (updateRouteDto.componentPath !== undefined) {
      route.componentPath = updateRouteDto.componentPath;
    }
    if (updateRouteDto.status !== undefined) {
      route.status = updateRouteDto.status;
    }
    if (updateRouteDto.routeType !== undefined) {
      route.routeType = updateRouteDto.routeType;
    }

    return this.toResponse(await this.routesRepository.save(route));
  }

  async remove(routeId: string) {
    await this.getRouteOrThrow(routeId);

    const childCount = await this.routesRepository.countBy({ pid: routeId });
    if (childCount > 0) {
      throw new ConflictException(`该路由下还有 ${childCount} 个子路由，不能删除`);
    }

    const referencedRoleCount = await this.rolesRepository
      .createQueryBuilder('role')
      .where('JSON_CONTAINS(role.routeIdGroup, :routeId)', {
        routeId: JSON.stringify(Number(routeId)),
      })
      .getCount();
    if (referencedRoleCount > 0) {
      throw new ConflictException(`该路由已被 ${referencedRoleCount} 个角色引用，不能删除`);
    }

    await this.routesRepository.delete(routeId);
    return { success: true, routeId: Number(routeId) };
  }

  private async ensureUnique(
    routeName?: string,
    routePath?: string,
    excludeRouteId?: string,
  ): Promise<void> {
    const conditions: FindOptionsWhere<AdminRoute>[] = [];

    if (routeName) {
      conditions.push({
        routeName,
        ...(excludeRouteId ? { routeId: Not(excludeRouteId) } : {}),
      });
    }

    if (routePath) {
      conditions.push({
        routePath,
        ...(excludeRouteId ? { routeId: Not(excludeRouteId) } : {}),
      });
    }

    if (conditions.length === 0) {
      return;
    }

    const route = await this.routesRepository.findOne({
      where: conditions,
      select: { routeId: true, routeName: true, routePath: true },
    });

    if (route) {
      const field = routeName && route.routeName === routeName ? 'routeName' : 'routePath';
      throw new ConflictException(`${field} 已存在`);
    }
  }

  private async ensureParentExists(pid?: number | null): Promise<void> {
    if (pid === undefined || pid === null) {
      return;
    }

    await this.getRouteOrThrow(String(pid));
  }

  private async ensureNoCycle(routeId: string, parentId: string): Promise<void> {
    let currentId: string | null = parentId;

    while (currentId) {
      if (currentId === routeId) {
        throw new BadRequestException('不能将子路由设置为父路由');
      }

      const current = await this.routesRepository.findOne({
        where: { routeId: currentId },
        select: { routeId: true, pid: true },
      });
      currentId = current?.pid ?? null;
    }
  }

  private async getRouteOrThrow(routeId: string): Promise<AdminRoute> {
    const route = await this.routesRepository.findOneBy({ routeId });

    if (!route) {
      throw new NotFoundException(`路由 ${routeId} 不存在`);
    }

    return route;
  }

  private toResponse(route: AdminRoute) {
    return {
      routeId: Number(route.routeId),
      routeName: route.routeName,
      icon: route.icon,
      routePath: route.routePath,
      componentPath: route.componentPath,
      pid: route.pid === null ? null : Number(route.pid),
      status: route.status,
      routeType: route.routeType,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };
  }
}
