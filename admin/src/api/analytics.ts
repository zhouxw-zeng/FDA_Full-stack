import { http } from './request';

import type { BehaviorAnalytics } from '@/types';

/**
 * GET /analytics/behavior
 * 注意：后端暂未提供该接口，当前由 src/mock 兜底，属于唯一的本地数据来源。
 */
export function fetchBehaviorAnalytics(range: number): Promise<BehaviorAnalytics> {
  return http.get<BehaviorAnalytics>('/analytics/behavior', { range });
}
