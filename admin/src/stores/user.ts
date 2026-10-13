import { defineStore } from 'pinia';

import * as authApi from '@/api/auth';
import type {
  ChangePasswordPayload,
  LoginParams,
  UpdateProfilePayload,
  UserProfile,
} from '@/types';
import { getToken, readJson, removeToken, setToken, storageKeys, writeJson } from '@/utils/storage';

interface UserState {
  token: string;
  profile: UserProfile | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    profile: readJson<UserProfile | null>(storageKeys.profile, null),
  }),
  getters: {
    roles: (state): UserProfile['roles'] => state.profile?.roles ?? [],
    nickname: (state): string => state.profile?.nickname ?? '未登录',
    isLoggedIn: (state): boolean => Boolean(state.token),
  },
  actions: {
    async login(params: LoginParams) {
      const result = await authApi.login(params);
      this.token = result.token;
      this.profile = result.profile;
      setToken(result.token);
      writeJson(storageKeys.profile, result.profile);
      return result;
    },
    async loadProfile() {
      const profile = await authApi.fetchProfile();
      this.profile = profile;
      writeJson(storageKeys.profile, profile);
      return profile;
    },
    async saveProfile(payload: UpdateProfilePayload) {
      const profile = await authApi.updateProfile(payload);
      this.profile = profile;
      writeJson(storageKeys.profile, profile);
      return profile;
    },
    changePassword(payload: ChangePasswordPayload) {
      return authApi.changePassword(payload);
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        this.clearAuth();
      }
    },
    clearAuth() {
      this.token = '';
      this.profile = null;
      removeToken();
      localStorage.removeItem(storageKeys.profile);
    },
  },
});

