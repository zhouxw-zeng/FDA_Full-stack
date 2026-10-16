import { http } from './request';

import type {
  AuditStatus,
  EnabledFlag,
  ForumChangeLog,
  ForumChangeLogQuery,
  ForumDynamic,
  ForumDynamicQuery,
  ForumDynamicType,
  MediaItem,
  PageResult,
} from '@/types';

/** int / tinyint 列可能以字符串返回，统一归一化成 number */
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

/**
 * GET /forum/admin/dynamics —— 分页查询论坛动态（管理端）
 * C 端的 /forum/dynamics 只接受移动端 token，管理端不能跨端调用。
 */
export async function fetchForumDynamics(
  params: ForumDynamicQuery,
): Promise<PageResult<ForumDynamic>> {
  const result = await http.get<PageResult<ForumDynamic>>('/forum/admin/dynamics', params);
  return { ...result, list: result.list.map(normalizeDynamic) };
}

/** GET /forum/admin/dynamics/:id —— 管理端详情 */
export async function fetchForumDynamicDetail(id: string): Promise<ForumDynamic> {
  return normalizeDynamic(await http.get<ForumDynamic>(`/forum/admin/dynamics/${id}`));
}

/** PUT /forum/dynamics/audit —— 审批通过 / 驳回，后端会同步写变更日志 */
export async function auditForumDynamic(payload: {
  id: string;
  status: Extract<AuditStatus, 'approved' | 'rejected'>;
  remark?: string;
}): Promise<ForumDynamic> {
  return normalizeDynamic(
    await http.put<ForumDynamic>('/forum/dynamics/audit', payload),
  );
}

/** PUT /forum/dynamics/status —— enabled=1 启用，enabled=0 下架 */
export async function updateForumDynamicStatus(payload: {
  id: string;
  enabled: EnabledFlag;
  remark?: string;
}): Promise<ForumDynamic> {
  return normalizeDynamic(
    await http.put<ForumDynamic>('/forum/dynamics/status', payload),
  );
}

/** DELETE /forum/dynamics/:id */
export function deleteForumDynamic(id: string): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/forum/dynamics/${id}`);
}

/** GET /forum/admin/media/preview —— 管理端动态媒体素材 */
export function fetchForumMediaPreview(): Promise<MediaItem[]> {
  return http.get<MediaItem[]>('/forum/admin/media/preview');
}

/** GET /forum/dynamic-types —— 动态类型，用于筛选项与预览页话题 */
export function fetchForumDynamicTypes(): Promise<PageResult<ForumDynamicType>> {
  return http.get<PageResult<ForumDynamicType>>('/forum/dynamic-types', {
    page: 1,
    size: 100,
    status: 0,
  });
}

/** GET /forum/change-logs —— 动态变更日志（审批 / 下架 / 编辑留痕） */
export function fetchForumChangeLogs(
  params: ForumChangeLogQuery,
): Promise<PageResult<ForumChangeLog>> {
  return http.get<PageResult<ForumChangeLog>>('/forum/change-logs', params);
}

