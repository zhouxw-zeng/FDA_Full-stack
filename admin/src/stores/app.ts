import { defineStore } from 'pinia';

import { readJson, storageKeys, writeJson } from '@/utils/storage';

export type ThemeMode = 'light' | 'dark';

interface Preferences {
  sidebarCollapsed: boolean;
  theme: ThemeMode;
}

const DEFAULT_PREFERENCES: Preferences = {
  sidebarCollapsed: false,
  theme: 'light',
};

export const useAppStore = defineStore('app', {
  state: (): Preferences => readJson<Preferences>(storageKeys.preferences, DEFAULT_PREFERENCES),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      this.persist();
    },
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      this.applyTheme();
      this.persist();
    },
    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    },
    applyTheme() {
      const root = document.documentElement;
      root.classList.toggle('dark', this.theme === 'dark');
      root.style.colorScheme = this.theme;
    },
    persist() {
      writeJson(storageKeys.preferences, {
        sidebarCollapsed: this.sidebarCollapsed,
        theme: this.theme,
      });
    },
  },
});
