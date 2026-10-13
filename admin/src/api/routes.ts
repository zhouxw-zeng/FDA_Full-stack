import { http } from './request';

import type { RouteTreeItem } from '@/types';

/** GET /routes/tree —— 全量路由树，前端按用户的 routeIdGroup 过滤后生成动态路由 */
export function fetchRouteTree(): Promise<RouteTreeItem[]> {
  return http.get<RouteTreeItem[]>('/routes/tree');
}

