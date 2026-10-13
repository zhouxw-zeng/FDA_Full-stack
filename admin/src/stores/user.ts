import { defineStore } from 'pinia';

import * as authApi from '@/api/auth';
import { updatePassword as updatePasswordApi, updateUser } from '@/api/users';
import type {
  AuthTokens,
  AuthUser,
  LoginParams,
  UpdateProfilePayload,
} from '@/types';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  readJson,
  setAccessToken,
  setRefreshToken,
  storageKeys,
  writeJson,
} from '@/utils/storage';

interface UserState {
  accessToken: string;
  refreshToken: string;
  profile: AuthUser | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    profile: readJson<AuthUser | null>(storageKeys.profile, null),
  }),
  getters: {
    isLoggedIn: (state): boolean => Boolean(state.accessToken),
    nickname: (state): string => state.profile?.nickname ?? '未登录',
    roleName: (state): string => state.profile?.roleName ?? '',
    routeIdGroup: (state): number[] => state.profile?.routeIdGroup ?? [],
  },
  actions: {
    /** token 同时写入 state 与 localStorage，刷新页面后仍保持登录 */
    applyTokens(tokens: AuthTokens) {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
    },
    setProfile(profile: AuthUser | null) {
      this.profile = profile;
      if (profile) {
        writeJson(storageKeys.profile, profile);
        return;
      }
      localStorage.removeItem(storageKeys.profile);
    },
    /** POST /auth/login */
    async login(params: LoginParams) {
      const result = await authApi.login(params);
      this.applyTokens(result);
      this.setProfile(result.user);
      return result;
    },
    /** GET /auth/profile */
    async loadProfile() {
      const profile = await authApi.fetchProfile();
      this.setProfile(profile);
      return profile;
    },
    /** PUT /users（后端目前只有这一个可更新用户的接口） */
    async saveProfile(payload: Omit<UpdateProfilePayload, 'id'>) {
      if (!this.profile) {
        throw new Error('当前用户信息缺失');
      }
      const profile = await updateUser({ ...payload, id: this.profile.id });
      this.setProfile(profile);
      return profile;
    },
    /** PUT /users —— 后端不校验原密码，因此前端只提交新密码 */
    async savePassword(newPassword: string) {
      if (!this.profile) {
        throw new Error('当前用户信息缺失');
      }
      return updatePasswordApi({ id: this.profile.id, newPassword });
    },
    /** POST /auth/logout：无论服务端是否成功，本地登录态都要清干净 */
    async logout() {
      const refreshToken = this.refreshToken;
      try {
        if (refreshToken) {
          await authApi.logout({ refreshToken });
        }
      } finally {
        this.clearAuth();
      }
    },
    clearAuth() {
      this.accessToken = '';
      this.refreshToken = '';
      this.profile = null;
      clearTokens();
      localStorage.removeItem(storageKeys.profile);
    },
  },
});

