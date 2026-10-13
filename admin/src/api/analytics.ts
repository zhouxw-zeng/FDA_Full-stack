import { http } from './request';

import type { ActivityItem, BehaviorAnalytics, DashboardOverview } from '@/types';

export function fetchDashboardOverview(): Promise<DashboardOverview> {
  return http.get<DashboardOverview>('/dashboard/overview');
}

export function fetchRecentActivities(): Promise<ActivityItem[]> {
  return http.get<ActivityItem[]>('/dashboard/activities');
}

export function fetchBehaviorAnalytics(range: number): Promise<BehaviorAnalytics> {
  return http.get<BehaviorAnalytics>('/analytics/behavior', { range });
}
