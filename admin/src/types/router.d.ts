import type { Component } from 'vue';
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单与面包屑展示名 */
    title?: string;
    /** 菜单图标，直接挂载图标组件 */
    icon?: Component;
    /** 对应后端 admin_routes.route_id */
    routeId?: number;
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
    /** 是否为承载子路由的布局容器 */
    layout?: boolean;
  }
}

