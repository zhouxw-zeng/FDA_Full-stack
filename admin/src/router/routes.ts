import type { RouteRecordRaw } from 'vue-router';

/**
 * 固定路由：登录页、无权限页、兜底 404。
 * 业务页面全部来自后端 /routes/tree，登录后按角色 routeIdGroup 动态挂载。
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true, hidden: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无访问权限', hidden: true },
  },
  {
    // 兜底路由：/ 与未匹配地址都会落到这里，再由守卫分流到首页或 403
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
];

