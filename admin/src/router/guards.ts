import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import type { Router } from 'vue-router';

import { usePermissionStore } from '@/stores/permission';
import { useUserStore } from '@/stores/user';

import { knownRoutePaths } from './routes';

NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 });

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async (to) => {
    NProgress.start();

    const userStore = useUserStore();
    const permissionStore = usePermissionStore();

    if (!userStore.token) {
      if (to.meta.public) {
        return true;
      }
      return {
        name: 'Login',
        query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
      };
    }

    // 已登录状态下去登录页，直接回到工作台
    if (to.meta.public) {
      return { path: '/dashboard', replace: true };
    }

    if (!userStore.profile) {
      try {
        await userStore.loadProfile();
      } catch {
        userStore.clearAuth();
        permissionStore.reset();
        return { name: 'Login', query: { redirect: to.fullPath } };
      }
    }

    if (!permissionStore.loaded) {
      const accessibleRoutes = permissionStore.generateRoutes(userStore.roles);
      accessibleRoutes.forEach((route) => router.addRoute(route));
      return { path: to.fullPath, replace: true };
    }

    // 路由存在但被角色过滤掉时，明确给出 403，而不是落到 404
    if (to.name === 'NotFound' && knownRoutePaths.has(to.path)) {
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

