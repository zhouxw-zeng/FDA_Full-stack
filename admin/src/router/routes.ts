import { markRaw } from 'vue';
import {
  ChatLineSquare,
  DataBoard,
  Promotion,
  TrendCharts,
  UserFilled,
  View,
} from '@element-plus/icons-vue';
import type { RouteRecordRaw } from 'vue-router';

const Layout = () => import('@/layout/index.vue');

/** 所有登录用户都能看到的固定路由 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: { hidden: true },
  },
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
  // 兜底路由始终存在：vue-router 按路径权重排序，不会遮蔽后面的业务路由，
  // 提前注册可以避免首次进入深层路由时出现 "No match found" 告警。
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
];

/** 需要按角色动态挂载的业务路由，同时作为侧边栏菜单数据源 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    meta: {
      title: '工作台',
      icon: markRaw(DataBoard),
      roles: ['super_admin', 'forum_admin', 'ad_admin'],
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: markRaw(DataBoard), keepAlive: true, breadcrumb: false },
      },
    ],
  },
  {
    path: '/forum',
    component: Layout,
    redirect: '/forum/approval',
    meta: {
      title: '论坛管理',
      icon: markRaw(ChatLineSquare),
      roles: ['super_admin', 'forum_admin'],
    },
    children: [
      {
        path: 'approval',
        name: 'ForumApproval',
        component: () => import('@/views/forum/approval/index.vue'),
        meta: { title: '论坛信息审批', keepAlive: true },
      },
      {
        path: 'dynamics',
        name: 'ForumDynamics',
        component: () => import('@/views/forum/dynamics/index.vue'),
        meta: { title: '论坛动态', keepAlive: true },
      },
    ],
  },
  {
    path: '/customer',
    component: Layout,
    redirect: '/customer/approval',
    meta: { title: '用户管理', icon: markRaw(UserFilled), roles: ['super_admin', 'forum_admin'] },
    children: [
      {
        path: 'approval',
        name: 'CustomerApproval',
        component: () => import('@/views/customer/approval/index.vue'),
        meta: { title: 'C 端用户审批', keepAlive: true },
      },
    ],
  },
  {
    path: '/advertising',
    component: Layout,
    redirect: '/advertising/list',
    meta: { title: '商业化', icon: markRaw(Promotion), roles: ['super_admin', 'ad_admin'] },
    children: [
      {
        path: 'list',
        name: 'AdvertisingList',
        component: () => import('@/views/advertising/list/index.vue'),
        meta: { title: '广告推广管理', keepAlive: true },
      },
    ],
  },
  {
    path: '/analytics',
    component: Layout,
    redirect: '/analytics/behavior',
    meta: { title: '数据分析', icon: markRaw(TrendCharts), roles: ['super_admin', 'ad_admin'] },
    children: [
      {
        path: 'behavior',
        name: 'AnalyticsBehavior',
        component: () => import('@/views/analytics/behavior/index.vue'),
        meta: { title: '用户行为分析', keepAlive: true },
      },
    ],
  },
  {
    path: '/preview',
    component: Layout,
    redirect: '/preview/dynamic',
    meta: {
      title: '内容工具',
      icon: markRaw(View),
      roles: ['super_admin', 'forum_admin', 'ad_admin'],
    },
    children: [
      {
        path: 'dynamic',
        name: 'PreviewDynamic',
        component: () => import('@/views/preview/dynamic/index.vue'),
        meta: { title: '动态预览', keepAlive: true },
      },
    ],
  },
  {
    path: '/profile',
    component: Layout,
    meta: { title: '个人信息', hidden: true, roles: ['super_admin', 'forum_admin', 'ad_admin'] },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人信息', hidden: true },
      },
    ],
  },
];

function resolvePaths(routes: RouteRecordRaw[], parentPath = ''): string[] {
  return routes.flatMap((route) => {
    const fullPath = route.path.startsWith('/')
      ? route.path
      : `${parentPath}/${route.path}`.replace(/\/{2,}/g, '/');
    const ownPath = fullPath === '' ? '/' : fullPath;
    return [ownPath, ...(route.children ? resolvePaths(route.children, ownPath) : [])];
  });
}

/**
 * 全部业务路由的路径集合（不受角色影响）。
 * 用途：区分「存在但当前角色无权访问」与「根本不存在的路径」，
 * 前者跳 403，后者交给兜底 404。
 */
export const knownRoutePaths = new Set(resolvePaths(asyncRoutes));


