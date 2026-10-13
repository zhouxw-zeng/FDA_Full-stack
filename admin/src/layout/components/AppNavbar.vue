<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowDown,
  Expand,
  Fold,
  FullScreen,
  Moon,
  Sunny,
  SwitchButton,
  User,
} from '@element-plus/icons-vue';
import { useFullscreen } from '@vueuse/core';

import { useConfirm } from '@/composables/useConfirm';
import { useLogout } from '@/composables/useLogout';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

import AppBreadcrumb from './AppBreadcrumb.vue';

defineOptions({ name: 'AppNavbar' });

defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();
const { confirm } = useConfirm();
const { logout } = useLogout();
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

const roleText = computed(() => userStore.roleName || '未分配角色');

async function handleLogout(): Promise<void> {
  const accepted = await confirm('退出后需要重新登录，确定继续吗？', {
    title: '退出登录',
    confirmText: '退出',
  });
  if (!accepted) {
    return;
  }
  await logout();
}

function handleCommand(command: string): void {
  if (command === 'profile') {
    void router.push('/profile');
  }
  if (command === 'logout') {
    void handleLogout();
  }
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__left">
      <button type="button" class="navbar__icon-btn" aria-label="切换菜单" @click="emit('toggle')">
        <el-icon><component :is="collapsed ? Expand : Fold" /></el-icon>
      </button>
      <AppBreadcrumb />
    </div>

    <div class="navbar__right">
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏显示'" placement="bottom">
        <button type="button" class="navbar__icon-btn" aria-label="全屏" @click="toggleFullscreen()">
          <el-icon><FullScreen /></el-icon>
        </button>
      </el-tooltip>

      <el-tooltip :content="appStore.theme === 'dark' ? '切换到浅色' : '切换到深色'" placement="bottom">
        <button type="button" class="navbar__icon-btn" aria-label="切换主题" @click="appStore.toggleTheme()">
          <el-icon><component :is="appStore.theme === 'dark' ? Sunny : Moon" /></el-icon>
        </button>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleCommand">
        <button type="button" class="navbar__user">
          <el-avatar :size="28" :src="userStore.profile?.avatar || undefined">
            {{ (userStore.nickname || '?').slice(0, 1) }}
          </el-avatar>
          <span class="navbar__user-meta">
            <strong>{{ userStore.nickname }}</strong>
            <small>{{ roleText }}</small>
          </span>
          <el-icon class="navbar__user-arrow"><ArrowDown /></el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" :icon="User">个人信息</el-dropdown-item>
            <el-dropdown-item command="logout" :icon="SwitchButton" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.navbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: var(--app-navbar-height);
  padding: 0 16px;
  background-color: var(--app-surface);
  border-bottom: 1px solid var(--app-border);

  &__left,
  &__right {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: var(--app-ink-2);
    font-size: 15px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    border-radius: var(--app-radius);

    &:hover {
      color: var(--app-primary);
      background-color: var(--app-surface-3);
    }
  }

  &__user {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    background-color: transparent;
    border: none;
    border-radius: var(--app-radius);

    &:hover {
      background-color: var(--app-surface-3);
    }
  }

  &__user-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.25;

    strong {
      color: var(--app-ink);
      font-size: 13px;
      font-weight: 600;
    }

    small {
      color: var(--app-ink-3);
      font-size: 11px;
    }
  }

  &__user-arrow {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  @media (max-width: 720px) {
    &__user-meta {
      display: none;
    }
  }
}
</style>

