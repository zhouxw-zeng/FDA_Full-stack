import type { Component } from 'vue';
import 'vue-router';

import type { AdminRole } from './auth';

declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单与面包屑展示名 */
    title?: string;
    /** 菜单图标，直接挂载图标组件 */
    icon?: Component;
    /** 可访问该路由的角色，缺省表示全部登录用户可见 */
    roles?: AdminRole[];
    /** 是否在侧边栏隐藏 */
    hidden?: boolean;
    /** 是否需要被 keep-alive 缓存 */
    keepAlive?: boolean;
    /** 是否在面包屑中展示 */
    breadcrumb?: boolean;
    /** 高亮的菜单项（详情页等非菜单路由使用） */
    activeMenu?: string;
    /** 免登录访问 */
    public?: boolean;
  }
}

