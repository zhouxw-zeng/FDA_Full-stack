import { http } from './request';

import type {
  ForumDynamic,
  ForumDynamicQuery,
  ForumPost,
  ForumPostQuery,
  MediaItem,
  PageResult,
} from '@/types';

export function fetchForumPosts(params: ForumPostQuery): Promise<PageResult<ForumPost>> {
  return http.get<PageResult<ForumPost>>('/forum/posts', params);
}

export function auditForumPost(
  id: string,
  payload: { status: 'approved' | 'rejected'; remark?: string },
): Promise<void> {
  return http.post<void>(`/forum/posts/${id}/audit`, payload);
}

export function fetchForumDynamics(
  params: ForumDynamicQuery,
): Promise<PageResult<ForumDynamic>> {
  return http.get<PageResult<ForumDynamic>>('/forum/dynamics', params);
}

export function fetchForumDynamicDetail(id: string): Promise<ForumDynamic> {
  return http.get<ForumDynamic>(`/forum/dynamics/${id}`);
}

export function deleteForumDynamic(id: string): Promise<void> {
  return http.delete<void>(`/forum/dynamics/${id}`);
}

export function fetchPreviewMedia(): Promise<MediaItem[]> {
  return http.get<MediaItem[]>('/forum/media/preview');
}

