import { http } from './request';

import type {
  LoginParams,
  LoginResult,
  RefreshTokenPayload,
  UpdateProfilePayload,
  UserProfile,
} from '@/types';

export function login(payload: LoginParams): Promise<LoginResult> {
  return http.post<LoginResult>('/mobile-auth/login', payload, {
    skipAuthRefresh: true,
    silent: true,
  });
}

export function refresh(payload: RefreshTokenPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/mobile-auth/refresh', payload, {
    skipAuthRefresh: true,
    silent: true,
  });
}

export function logout(payload: RefreshTokenPayload): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/mobile-auth/logout', payload, { silent: true });
}

export function fetchProfile(): Promise<UserProfile> {
  return http.get<UserProfile>('/mobile-auth/profile');
}

export function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return http.put<UserProfile>('/mobile-auth/profile', payload);
}
