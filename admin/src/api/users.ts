import { http } from './request';

import type { AuthUser, UpdatePasswordPayload, UpdateProfilePayload } from '@/types';

/**
 * PUT /users —— 后端目前唯一可更新用户的接口（id 从 Body 传入）。
 * 个人资料与密码修改都走这里。
 */
export function updateUser(payload: UpdateProfilePayload): Promise<AuthUser> {
  return http.put<AuthUser>('/users', payload);
}

/**
 * 注意：后端该接口只接收新密码，不校验原密码。
 * 前端因此只收集新密码，改密安全策略需要后端补充专用接口。
 */
export function updatePassword(payload: UpdatePasswordPayload): Promise<AuthUser> {
  return http.put<AuthUser>('/users', {
    id: payload.id,
    password: payload.newPassword,
  });
}
