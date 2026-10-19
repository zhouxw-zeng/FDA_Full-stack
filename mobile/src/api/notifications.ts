import { http } from './request';

import type { ForumNotification, PageResult } from '@/types';

export function fetchForumNotifications(
  page = 1,
  size = 15,
): Promise<PageResult<ForumNotification>> {
  return http.get<PageResult<ForumNotification>>('/forum/notifications', {
    page,
    size,
  });
}

export function fetchUnreadNotificationCount(): Promise<{ count: number }> {
  return http.get<{ count: number }>('/forum/notifications/unread-count');
}

export function markForumNotificationRead(
  notificationId: string,
): Promise<{ success: boolean; id: string }> {
  return http.put<{ success: boolean; id: string }>(`/forum/notifications/${notificationId}/read`);
}

export function markAllForumNotificationsRead(): Promise<{
  success: boolean;
  updatedCount: number;
}> {
  return http.put<{ success: boolean; updatedCount: number }>('/forum/notifications/read-all');
}

export function deleteForumNotification(
  notificationId: string,
): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/forum/notifications/${notificationId}`);
}

export function clearForumNotifications(): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  return http.delete<{ success: boolean; deletedCount: number }>('/forum/notifications');
}
