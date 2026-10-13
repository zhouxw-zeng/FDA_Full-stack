import { http } from './request';

import type {
  ChangePasswordPayload,
  LoginParams,
  LoginResult,
  UpdateProfilePayload,
  UserProfile,
} from '@/types';

export function login(payload: LoginParams): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', payload);
}

export function logout(): Promise<void> {
  return http.post<void>('/auth/logout');
}

export function fetchProfile(): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/profile');
}

export function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return http.put<UserProfile>('/auth/profile', payload);
}

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return http.put<void>('/auth/password', payload);
}
