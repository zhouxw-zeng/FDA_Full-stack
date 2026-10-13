import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import type { Router } from 'vue-router';

import { usePermissionStore } from '@/stores/permission';
import { useUserStore } from '@/stores/user';

import { registerDynamicRoutes } from './register';

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 });

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async (to) => {
    NProgress.start();

    const userStore = useUserStore();
    const permissionStore = usePermissionStore();
    const homePath = () => permissionStore.homePath || '/403';

    // 1. 未登录：公开页放行，其余跳登录并记录回跳地址
    if (!userStore.accessToken) {
      if (to.meta.public) {
        return true;
      }
      return {
        name: 'Login',
        query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
      };
    }

    // 2. 有 token 但没有用户信息（例如刷新页面后只恢复了 token）
    if (!userStore.profile) {
      try {
        await userStore.loadProfile();
      } catch {
        userStore.clearAuth();
        permissionStore.reset();
        return { name: 'Login', query: { redirect: to.fullPath } };
      }
    }

    // 3. 首次进入：按 routeIdGroup 拉取并挂载动态路由
    if (!permissionStore.loaded) {
      try {
        await registerDynamicRoutes(router, userStore.routeIdGroup);
      } catch {
        userStore.clearAuth();
        permissionStore.reset();
        return { name: 'Login', query: { redirect: to.fullPath } };
      }
      // 路由表刚刚变化，需要用新的匹配结果重新导航一次
      return {
        path: to.meta.public || to.path === '/' ? homePath() : to.fullPath,
        replace: true,
      };
    }

    // 4. 已登录访问登录页或根路径 → 落到该角色的首页
    if (to.meta.public || to.path === '/') {
      return { path: homePath(), replace: true };
    }

    // 5. 地址在路由表里存在、但当前角色没被授权 → 403（真正不存在的路径交给 404）
    if (to.name === 'NotFound' && permissionStore.knownPaths.has(to.path)) {
      return { path: '/403', replace: true };
    }

    return true;
  });

  router.afterEach((to) => {
    const appTitle = __APP_TITLE__;
    document.title = to.meta.title ? `${to.meta.title} · ${appTitle}` : appTitle;
    NProgress.done();
  });

  router.onError(() => {
    NProgress.done();
  });
}

