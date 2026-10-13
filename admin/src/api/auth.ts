import { http } from './request';

import type { AuthUser, LoginParams, LoginResult, RefreshTokenPayload } from '@/types';

/** POST /auth/login —— 账号密码登录，返回 accessToken / refreshToken / 用户信息 */
export function login(payload: LoginParams): Promise<LoginResult> {
  // 登录失败也是 401，这里不要触发自动续期，否则会把后端的错误信息盖掉
  return http.post<LoginResult>('/auth/login', payload, { skipAuthRefresh: true });
}

/** POST /auth/refresh —— 用 refreshToken 换新令牌（401 拦截器内部也会调用） */
export function refresh(payload: RefreshTokenPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/refresh', payload, {
    skipAuthRefresh: true,
    silent: true,
  });
}

/** POST /auth/logout —— 注销当前 refreshToken 会话 */
export function logout(payload: RefreshTokenPayload): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/auth/logout', payload, { silent: true });
}

/** GET /auth/profile —— 获取当前登录用户信息（含 routeIdGroup） */
export function fetchProfile(): Promise<AuthUser> {
  return http.get<AuthUser>('/auth/profile');
}
