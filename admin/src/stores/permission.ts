import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import { fetchRouteTree } from '@/api/routes';
import { buildDynamicRoutes } from '@/router/dynamic';

interface PermissionState {
  /** 可挂载到 router 的业务路由 */
  routes: RouteRecordRaw[];
  /** 侧边栏菜单，与 routes 同源 */
  menus: RouteRecordRaw[];
  /** 当前角色可访问的路径 */
  accessiblePaths: Set<string>;
  /** 后端全量路径，用于区分 403 与 404 */
  knownPaths: Set<string>;
  /** 登录后的默认落地页 */
  homePath: string;
  loaded: boolean;
  loading: boolean;
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routes: [],
    menus: [],
    accessiblePaths: new Set<string>(),
    knownPaths: new Set<string>(),
    homePath: '',
    loaded: false,
    loading: false,
  }),
  actions: {
    /**
     * 拉取后端路由树，按角色的 routeIdGroup 过滤并生成前端路由。
     * 这是「权限 → 路由」的唯一入口。
     */
    async generateRoutes(routeIdGroup: number[]): Promise<RouteRecordRaw[]> {
      this.loading = true;
      try {
        const tree = await fetchRouteTree();
        const result = buildDynamicRoutes(tree, routeIdGroup);

        this.routes = result.routes;
        this.menus = result.menus;
        this.accessiblePaths = result.accessiblePaths;
        this.knownPaths = result.knownPaths;
        this.homePath = result.homePath;
        this.loaded = true;

        return this.routes;
      } finally {
        this.loading = false;
      }
    },
    reset() {
      this.routes = [];
      this.menus = [];
      this.accessiblePaths = new Set<string>();
      this.knownPaths = new Set<string>();
      this.homePath = '';
      this.loaded = false;
      this.loading = false;
    },
  },
});

