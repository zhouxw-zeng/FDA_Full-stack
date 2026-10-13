import { h, markRaw, type Component } from 'vue';
import { RouterView, type RouteMeta, type RouteRecordRaw } from 'vue-router';

import { resolveMenuIcon } from '@/constants/icons';
import type { RouteTreeItem } from '@/types';

import { resolveViewComponent } from './view-registry';

/**
 * 顶层节点统一挂载后台布局，保证侧边栏与顶栏始终存在。
 * 这里用惰性加载而不是静态 import：布局内部会引用 permission store，
 * 静态引入会与本模块形成循环依赖。
 */
const LAYOUT_COMPONENT = () => import('@/layout/index.vue');

/** 动态路由统一加前缀命名，登出时可以按前缀精确移除 */
export const DYNAMIC_ROUTE_PREFIX = 'dyn:';

/** 三级及以下的目录节点只负责透传 <router-view> */
const PASS_THROUGH_COMPONENT: Component = markRaw({
  name: 'RoutePassThrough',
  render: () => h(RouterView),
});

export interface DynamicRoutes {
  /** 直接交给 router.addRoute 的路由 */
  routes: RouteRecordRaw[];
  /** 侧边栏菜单，与 routes 同源 */
  menus: RouteRecordRaw[];
  /** 当前用户可访问的路径 */
  accessiblePaths: Set<string>;
  /** 后端全量路径（含无权限的），用于区分 403 与 404 */
  knownPaths: Set<string>;
  /** 登录后的默认落地页：第一个可访问的菜单 */
  homePath: string;
}

function toContainerName(routePath: string): string {
  return `${DYNAMIC_ROUTE_PREFIX}${toRouteName(routePath)}`;
}

/** /forum/approval → ForumApproval，与页面内 defineOptions 的 name 保持一致，keep-alive 才能命中 */
function toRouteName(routePath: string): string {
  const name = routePath
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return name || 'Root';
}

/** 子路由使用相对路径，避免出现绝对路径与父级前缀重复 */
function toChildPath(parentPath: string, routePath: string): string {
  if (routePath.startsWith(`${parentPath}/`)) {
    return routePath.slice(parentPath.length + 1);
  }
  return routePath;
}

function collectPaths(nodes: RouteTreeItem[], target: Set<string>): void {
  for (const node of nodes) {
    target.add(node.routePath);
    if (node.children?.length) {
      collectPaths(node.children, target);
    }
  }
}

/** 只保留启用状态、且在角色 routeIdGroup 内的节点；目录节点若无可用子项则一并去掉 */
function filterByRouteIds(nodes: RouteTreeItem[], allowed: Set<number>): RouteTreeItem[] {
  const result: RouteTreeItem[] = [];

  for (const node of nodes) {
    if (node.status !== 0 || !allowed.has(node.routeId)) {
      continue;
    }

    const children = filterByRouteIds(node.children ?? [], allowed);
    if (node.routeType === 0 && children.length === 0) {
      continue;
    }

    result.push({ ...node, children });
  }

  return result;
}

function findFirstMenuPath(nodes: RouteTreeItem[]): string | undefined {
  for (const node of nodes) {
    if (node.routeType === 1) {
      return node.routePath;
    }
    const childPath = findFirstMenuPath(node.children ?? []);
    if (childPath) {
      return childPath;
    }
  }
  return undefined;
}

function buildMeta(node: RouteTreeItem): RouteMeta {
  return {
    title: node.routeName,
    icon: resolveMenuIcon(node.icon),
    routeId: node.routeId,
  };
}

function buildChildren(
  nodes: RouteTreeItem[],
  parentPath: string,
  depth: number,
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];

  for (const node of nodes) {
    const path = toChildPath(parentPath, node.routePath);
    const meta = buildMeta(node);

    if (node.routeType === 0) {
      routes.push({
        path,
        component: depth === 0 ? LAYOUT_COMPONENT : PASS_THROUGH_COMPONENT,
        meta,
        children: buildChildren(node.children ?? [], node.routePath, depth + 1),
      });
      continue;
    }

    const component = resolveViewComponent(node.componentPath);
    if (!component) {
      continue;
    }

    routes.push({
      path,
      name: toRouteName(node.routePath),
      component,
      meta: { ...meta, keepAlive: true },
    });
  }

  return routes;
}

function buildTopLevel(node: RouteTreeItem): RouteRecordRaw | undefined {
  const meta = buildMeta(node);

  if (node.routeType === 0) {
    const children = buildChildren(node.children ?? [], node.routePath, 1);
    if (children.length === 0) {
      return undefined;
    }
    return {
      path: node.routePath,
      name: toContainerName(node.routePath),
      component: LAYOUT_COMPONENT,
      meta: { ...meta, layout: true },
      children,
    };
  }

  const component = resolveViewComponent(node.componentPath);
  if (!component) {
    return undefined;
  }

  // 顶层菜单同样套一层布局，子级用空路径承载自身
  return {
    path: node.routePath,
    name: toContainerName(node.routePath),
    component: LAYOUT_COMPONENT,
    meta: { ...meta, layout: true },
    children: [
      {
        path: '',
        name: toRouteName(node.routePath),
        component,
        meta: { ...meta, keepAlive: true, breadcrumb: false },
      },
    ],
  };
}

/**
 * 由后端路由树 + 用户 routeIdGroup 生成动态路由。
 * 生成过程中同时产出菜单、可访问路径集合与默认首页。
 */
export function buildDynamicRoutes(
  tree: RouteTreeItem[],
  routeIdGroup: number[],
): DynamicRoutes {
  const allowed = new Set(routeIdGroup);
  const accessibleTree = filterByRouteIds(tree, allowed);

  const knownPaths = new Set<string>();
  collectPaths(tree.filter((node) => node.status === 0), knownPaths);

  const accessiblePaths = new Set<string>();
  collectPaths(accessibleTree, accessiblePaths);

  const routes = accessibleTree
    .map((node) => buildTopLevel(node))
    .filter((route): route is RouteRecordRaw => Boolean(route));

  return {
    routes,
    menus: routes,
    accessiblePaths,
    knownPaths,
    homePath: findFirstMenuPath(accessibleTree) ?? '/profile',
  };
}
