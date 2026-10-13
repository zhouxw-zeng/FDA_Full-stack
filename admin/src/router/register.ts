import type { Router } from 'vue-router';

import { usePermissionStore } from '@/stores/permission';

import { DYNAMIC_ROUTE_PREFIX } from './dynamic';

/**
 * 拉取路由树 → 按角色的 routeIdGroup 过滤 → 挂载到 router。
 * 登录成功后与路由守卫都会调用，store 内部用 loaded 标记避免重复挂载。
 */
export async function registerDynamicRoutes(
  router: Router,
  routeIdGroup: number[],
): Promise<void> {
  const permissionStore = usePermissionStore();

  await permissionStore.generateRoutes(routeIdGroup);
  permissionStore.routes.forEach((route) => {
    router.addRoute(route);
  });
}

/** 登出时移除本次会话挂载的业务路由，避免下一个账号复用上一个账号的权限 */
export function resetDynamicRoutes(router: Router): void {
  router.getRoutes().forEach((route) => {
    if (typeof route.name === 'string' && route.name.startsWith(DYNAMIC_ROUTE_PREFIX)) {
      router.removeRoute(route.name);
    }
  });
}
