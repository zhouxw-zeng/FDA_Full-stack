import { clearCache, getCache, setCache } from './cache';

import type { UserInfo, UserProfile } from '@/types';

const ACCESS_TOKEN_KEY = 'mobile_access_token';
const REFRESH_TOKEN_KEY = 'mobile_refresh_token';
const PROFILE_CACHE_KEY = 'profile';
const USER_INFO_CACHE_KEY = 'user_info';

function readString(key: string): string {
  const value = uni.getStorageSync(key);
  return typeof value === 'string' ? value : '';
}

export function getAccessToken(): string {
  return readString(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string {
  return readString(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  uni.setStorageSync(ACCESS_TOKEN_KEY, accessToken);
  uni.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
}

export function setUser(user: UserProfile): void {
  setCache(PROFILE_CACHE_KEY, user);
}

export function getUser(): UserProfile | null {
  return getCache<UserProfile>(PROFILE_CACHE_KEY);
}

export function setUserInfo(userInfo: UserInfo): void {
  setCache(USER_INFO_CACHE_KEY, userInfo);
}

export function getUserInfo(): UserInfo | null {
  return getCache<UserInfo>(USER_INFO_CACHE_KEY);
}

export function clearAuthStorage(): void {
  uni.removeStorageSync(ACCESS_TOKEN_KEY);
  uni.removeStorageSync(REFRESH_TOKEN_KEY);
  clearCache();
}
