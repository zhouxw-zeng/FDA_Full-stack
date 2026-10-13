<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { usePermissionStore } from '@/stores/permission';

import SidebarMenu from './SidebarMenu.vue';

defineOptions({ name: 'AppSidebar' });

const props = withDefaults(
  defineProps<{
    mobile?: boolean;
    mobileOpen?: boolean;
  }>(),
  {
    mobile: false,
    mobileOpen: false,
  },
);

const emit = defineEmits<{
  navigate: [];
}>();

const route = useRoute();
const appStore = useAppStore();
const permissionStore = usePermissionStore();

const collapsed = computed(() => !props.mobile && appStore.sidebarCollapsed);
const activeMenu = computed(() => route.meta.activeMenu ?? route.path);

const visibleMenus = computed(() => permissionStore.menus.filter((item) => !item.meta?.hidden));
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      'sidebar--collapsed': collapsed,
      'sidebar--mobile': props.mobile,
      'sidebar--mobile-open': props.mobileOpen,
    }"
  >
    <div class="sidebar__brand">
      <span class="sidebar__logo">相</span>
      <span class="sidebar__brand-text">
        <strong>相册视频论坛</strong>
        <small>管理后台</small>
      </span>
    </div>

    <el-scrollbar class="sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        unique-opened
        router
        popper-class="app-menu-popper"
        @select="emit('navigate')"
      >
        <SidebarMenu v-for="menu in visibleMenus" :key="menu.path" :route="menu" :base-path="''" />
      </el-menu>
    </el-scrollbar>

    <footer class="sidebar__footer">
      <span>v0.1.0 · 学习项目</span>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: var(--app-sidebar-width);
  background-color: var(--app-sidebar-bg);
  transition: width 0.2s ease;

  &__brand {
    display: flex;
    gap: 10px;
    align-items: center;
    height: var(--app-navbar-height);
    padding: 0 16px;
    border-bottom: 1px solid var(--app-sidebar-border);
  }

  &__logo {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    background-color: var(--app-primary);
    border-radius: var(--app-radius);
  }

  &__brand-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    white-space: nowrap;

    strong {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.3;
    }

    small {
      color: var(--app-sidebar-ink);
      font-size: 11px;
      line-height: 1.3;
    }
  }

  &__scroll {
    flex: 1;
    min-height: 0;
    padding: 8px 0;
  }

  &__footer {
    padding: 10px 16px;
    color: var(--app-sidebar-ink);
    font-size: 11px;
    border-top: 1px solid var(--app-sidebar-border);
  }

  &--collapsed {
    width: var(--app-sidebar-collapsed-width);

    .sidebar__brand {
      justify-content: center;
      padding: 0;
    }

    .sidebar__brand-text,
    .sidebar__footer {
      display: none;
    }
  }

  :deep(.el-menu) {
    background-color: transparent;
    border-right: none;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 40px;
    margin: 2px 8px;
    color: var(--app-sidebar-ink);
    border-radius: var(--app-radius);

    &:hover {
      color: #fff;
      background-color: var(--app-sidebar-bg-hover);
    }
  }

  :deep(.el-menu-item.is-active) {
    color: #fff;
    background-color: var(--app-sidebar-bg-active);
    box-shadow: inset 2px 0 0 var(--app-primary);
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #fff;
  }

  :deep(.el-menu--inline) {
    background-color: transparent;
  }

  @media (max-width: 900px) {
    &--mobile {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: var(--app-z-drawer);
      transform: translateX(-100%);
      transition: transform 0.22s ease;
    }

    &--mobile-open {
      transform: translateX(0);
    }
  }
}
</style>

