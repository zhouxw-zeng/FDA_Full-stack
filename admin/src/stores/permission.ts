import type { RouteRecordRaw } from 'vue-router';

import { defineStore } from 'pinia';

import { asyncRoutes } from '@/router/routes';
import type { AdminRole } from '@/types';

function hasPermission(roles: AdminRole[], route: RouteRecordRaw): boolean {
  const allowed = route.meta?.roles;
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return roles.some((role) => allowed.includes(role));
}

/** 递归过滤出当前角色可访问的路由，父级无权限时整棵子树都会被裁掉 */
export function filterRoutesByRole(
  routes: RouteRecordRaw[],
  roles: AdminRole[],
): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = [];
  routes.forEach((route) => {
    if (!hasPermission(roles, route)) {
      return;
    }
    const cloned: RouteRecordRaw = { ...route };
    if (route.children?.length) {
      cloned.children = filterRoutesByRole(route.children, roles);
    }
    result.push(cloned);
  });
  return result;
}

interface PermissionState {
  /** 已按角色过滤、用于渲染菜单的路由 */
  menus: RouteRecordRaw[];
  /** 动态路由是否已挂载 */
  loaded: boolean;
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    menus: [],
    loaded: false,
  }),
  actions: {
    generateRoutes(roles: AdminRole[]): RouteRecordRaw[] {
      const accessible = filterRoutesByRole(asyncRoutes, roles);
      this.menus = accessible;
      this.loaded = true;
      return accessible;
    },
    reset() {
      this.menus = [];
      this.loaded = false;
    },
  },
});

