import { useRouter } from 'vue-router';

import { resetDynamicRoutes } from '@/router/register';
import { usePermissionStore } from '@/stores/permission';
import { useUserStore } from '@/stores/user';

/**
 * 统一登出：注销服务端会话 → 清理本地登录态 → 移除动态路由。
 * 动态路由必须移除，否则下一个账号会继承上一个账号挂载过的页面。
 */
export function useLogout() {
  const router = useRouter();
  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  async function logout(): Promise<void> {
    await userStore.logout();
    permissionStore.reset();
    resetDynamicRoutes(router);
    await router.replace({ name: 'Login' });
  }

  return { logout };
}

