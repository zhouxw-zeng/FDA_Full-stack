import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import {
  fetchProfile,
  login as loginApi,
  logout as logoutApi,
  updateProfile,
} from '@/api/auth';
import { fetchUserInfo } from '@/api/customers';
import type { LoginParams, UpdateProfilePayload, UserInfo, UserProfile } from '@/types';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getUser,
  getUserInfo,
  setTokens,
  setUser,
  setUserInfo,
} from '@/utils/storage';

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(getAccessToken());
  const refreshToken = ref(getRefreshToken());
  const user = ref<UserProfile | null>(getUser());
  const userInfo = ref<UserInfo | null>(getUserInfo());
  const isLoggedIn = computed(() => Boolean(accessToken.value && user.value));

  async function login(payload: LoginParams): Promise<void> {
    const result = await loginApi(payload);
    accessToken.value = result.accessToken;
    refreshToken.value = result.refreshToken;
    user.value = result.profile;
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.profile);
    await Promise.all([loadProfile(), loadUserInfo()]);
  }

  async function logout(): Promise<void> {
    const currentRefreshToken = refreshToken.value || getRefreshToken();
    if (currentRefreshToken) {
      try {
        await logoutApi({ refreshToken: currentRefreshToken });
      } catch {
        // 后端不可用时仍要清理本地登录态，避免用户卡在失效状态。
      }
    }

    accessToken.value = '';
    refreshToken.value = '';
    user.value = null;
    userInfo.value = null;
    clearAuthStorage();
  }

  async function loadProfile(): Promise<UserProfile> {
    const profile = await fetchProfile();
    user.value = profile;
    setUser(profile);
    return profile;
  }

  async function loadUserInfo(): Promise<UserInfo> {
    const info = await fetchUserInfo();
    userInfo.value = info;
    setUserInfo(info);
    return info;
  }

  async function saveProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    if (!user.value?.id) {
      throw new Error('请先登录');
    }

    const profile = await updateProfile(payload);
    user.value = profile;
    setUser(profile);
    await loadUserInfo();
    return profile;
  }

  return {
    accessToken,
    refreshToken,
    user,
    userInfo,
    isLoggedIn,
    login,
    logout,
    loadProfile,
    loadUserInfo,
    saveProfile,
  };
});
