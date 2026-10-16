import { http } from './request';

import type {
  CreateMyForumDynamicPayload,
  ForumComment,
  ForumDynamic,
  ForumDynamicQuery,
  ForumInteractionInfo,
  MyForumDynamicQuery,
  PageResult,
  UpdateMyForumDynamicPayload,
} from '@/types';

function normalizeDynamic(dynamic: ForumDynamic): ForumDynamic {
  return {
    ...dynamic,
    typeId: Number(dynamic.typeId),
    likeCount: Number(dynamic.likeCount),
    commentCount: Number(dynamic.commentCount),
    favoriteCount: Number(dynamic.favoriteCount),
    shareCount: Number(dynamic.shareCount),
    liked: Boolean(dynamic.liked),
    favorited: Boolean(dynamic.favorited),
    enabled: Number(dynamic.enabled) === 1 ? 1 : 0,
  };
}

export async function fetchForumDynamics(
  params: ForumDynamicQuery,
): Promise<PageResult<ForumDynamic>> {
  const result = await http.get<PageResult<ForumDynamic>>('/forum/dynamics', {
    page: params.page ?? 1,
    size: params.size ?? 10,
    keyword: params.keyword,
    topic: params.topic,
    typeId: params.typeId,
    pinned: params.pinned,
    auditStatus: params.auditStatus,
    enabled: params.enabled,
  });

  return { ...result, list: result.list.map(normalizeDynamic) };
}

export async function fetchMyForumDynamics(
  params: MyForumDynamicQuery,
): Promise<PageResult<ForumDynamic>> {
  const result = await http.get<PageResult<ForumDynamic>>('/forum/dynamics/mine', {
    page: params.page ?? 1,
    size: params.size ?? 10,
    keyword: params.keyword,
    topic: params.topic,
    typeId: params.typeId,
    pinned: params.pinned,
    status: params.status,
  });

  return { ...result, list: result.list.map(normalizeDynamic) };
}

export async function fetchForumDynamicDetail(id: string): Promise<ForumDynamic> {
  return normalizeDynamic(await http.get<ForumDynamic>(`/forum/dynamics/${id}`));
}

export function updateMyForumDynamic(
  id: string,
  payload: UpdateMyForumDynamicPayload,
): Promise<ForumDynamic> {
  return http.put<ForumDynamic>(`/forum/dynamics/${id}`, payload).then(normalizeDynamic);
}

export function deleteMyForumDynamic(id: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/forum/dynamics/${id}`);
}

export function createForumDynamic(
  payload: CreateMyForumDynamicPayload,
): Promise<ForumDynamic> {
  return http.post<ForumDynamic>('/forum/dynamics', payload).then(normalizeDynamic);
}

export function toggleForumDynamicLike(
  dynamicId: string,
  action: 'like' | 'unlike',
  requestId?: string,
): Promise<ForumInteractionInfo> {
  return http.put<ForumInteractionInfo>('/forum/dynamics/like', {
    dynamicId,
    action,
    requestId,
  });
}

export function toggleForumDynamicFavorite(
  dynamicId: string,
  action: 'favorite' | 'unfavorite',
  requestId?: string,
): Promise<ForumInteractionInfo> {
  return http.put<ForumInteractionInfo>('/forum/dynamics/favorite', {
    dynamicId,
    action,
    requestId,
  });
}

export function shareForumDynamic(
  dynamicId: string,
  channel?: string,
  requestId?: string,
): Promise<ForumInteractionInfo> {
  return http.post<ForumInteractionInfo>('/forum/dynamics/share', {
    dynamicId,
    channel,
    requestId,
  });
}

export function fetchForumComments(
  dynamicId: string,
  page = 1,
  size = 20,
  sort: 'likes' | 'latest' | 'replies' = 'likes',
): Promise<PageResult<ForumComment>> {
  return http.get<PageResult<ForumComment>>(`/forum/dynamics/${dynamicId}/comments`, {
    page,
    size,
    sort,
  });
}

export function createForumComment(payload: {
  dynamicId: string;
  content: string;
  parentId?: string;
  requestId?: string;
}): Promise<ForumComment> {
  return http.post<ForumComment>('/forum/comments', payload);
}

export function fetchForumCommentReplies(
  rootId: string,
  page = 1,
  size = 20,
): Promise<PageResult<ForumComment>> {
  return http.get<PageResult<ForumComment>>(`/forum/comments/${rootId}/replies`, {
    page,
    size,
  });
}

export function deleteForumComment(
  id: string,
): Promise<{ success: boolean; id: string; deletedCount?: number }> {
  return http.delete<{ success: boolean; id: string; deletedCount?: number }>(
    `/forum/comments/${id}`,
  );
}
