<script setup lang="ts">
import { computed } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { usePermissionStore } from '@/stores/permission';

defineOptions({ name: 'AppMain' });

const permissionStore = usePermissionStore();

/** keep-alive 的 include 需要与页面组件名一致，所以视图里都显式声明了 name */
const cachedViews = computed(() => {
  const names: string[] = [];
  const walk = (routes: RouteRecordRaw[]): void => {
    routes.forEach((item) => {
      if (item.name && item.meta?.keepAlive) {
        names.push(String(item.name));
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(permissionStore.menus);
  return names;
});
</script>

<template>
  <main class="app-main">
    <RouterView v-slot="{ Component, route }">
      <transition name="route-fade" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </RouterView>
  </main>
</template>

<style scoped lang="scss">
.app-main {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;

  @media (max-width: 720px) {
    padding: 12px;
  }
}
</style>
