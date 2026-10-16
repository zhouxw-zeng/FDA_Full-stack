import { http } from './request';

import type { ForumDynamic, ForumDynamicQuery, PageResult } from '@/types';

function normalizeDynamic(dynamic: ForumDynamic): ForumDynamic {
  return {
    ...dynamic,
    typeId: Number(dynamic.typeId),
    likeCount: Number(dynamic.likeCount),
    commentCount: Number(dynamic.commentCount),
    shareCount: Number(dynamic.shareCount),
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

export async function fetchForumDynamicDetail(id: string): Promise<ForumDynamic> {
  return normalizeDynamic(await http.get<ForumDynamic>(`/forum/dynamics/${id}`));
}
