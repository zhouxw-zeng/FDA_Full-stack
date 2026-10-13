import type { Component } from 'vue';

type ViewLoader = () => Promise<Component>;

/**
 * 后端 admin_routes.component_path 指向具体页面文件（例如 @/views/forum/approval/index.vue）。
 * 打包器只能识别静态的 import 说明符，所以这里维护一份显式映射：
 * 既保持路由级懒加载，又能在路径缺失时给出明确提示。
 */
const VIEW_LOADERS: Record<string, ViewLoader> = {
  'dashboard/index.vue': () => import('@/views/dashboard/index.vue'),
  'forum/approval/index.vue': () => import('@/views/forum/approval/index.vue'),
  'forum/dynamics/index.vue': () => import('@/views/forum/dynamics/index.vue'),
  'customer/approval/index.vue': () => import('@/views/customer/approval/index.vue'),
  'advertising/list/index.vue': () => import('@/views/advertising/list/index.vue'),
  'analytics/behavior/index.vue': () => import('@/views/analytics/behavior/index.vue'),
  'preview/dynamic/index.vue': () => import('@/views/preview/dynamic/index.vue'),
  'profile/index.vue': () => import('@/views/profile/index.vue'),
};

function toRegistryKey(componentPath: string): string {
  return componentPath
    .replace(/^@\/views\//, '')
    .replace(/^\/?views\//, '')
    .replace(/^\.\//, '');
}

/**
 * 把后端的 componentPath 解析成路由组件。
 * 解析不到时返回 undefined，由路由构建阶段跳过并打印告警，避免整站白屏。
 */
export function resolveViewComponent(componentPath: string | null): ViewLoader | undefined {
  if (!componentPath) {
    return undefined;
  }

  const loader = VIEW_LOADERS[toRegistryKey(componentPath)];
  if (!loader && __DEV__) {
    console.warn(
      `[router] 未在后端路由表找到对应页面组件：${componentPath}，` +
        '请在 src/router/view-registry.ts 中补充映射。',
    );
  }
  return loader;
}

