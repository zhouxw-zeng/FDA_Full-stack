<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';

import { useAppStore } from '@/stores/app';

import AppMain from './components/AppMain.vue';
import AppNavbar from './components/AppNavbar.vue';
import AppSidebar from './components/AppSidebar.vue';

defineOptions({ name: 'AdminLayout' });

const appStore = useAppStore();
const isMobile = useMediaQuery('(max-width: 900px)');
const mobileOpen = ref(false);

function handleSidebarToggle(): void {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value;
    return;
  }
  appStore.toggleSidebar();
}

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileOpen.value = false;
  }
});
</script>

<template>
  <div
    class="layout"
    :class="{
      'layout--collapsed': appStore.sidebarCollapsed && !isMobile,
      'layout--mobile': isMobile,
      'layout--mobile-open': mobileOpen,
    }"
  >
    <AppSidebar :mobile="isMobile" :mobile-open="mobileOpen" @navigate="mobileOpen = false" />

    <div
      v-if="isMobile && mobileOpen"
      class="layout__backdrop"
      role="presentation"
      @click="mobileOpen = false"
    />

    <div class="layout__body">
      <AppNavbar :collapsed="appStore.sidebarCollapsed" @toggle="handleSidebarToggle" />
      <AppMain />
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  background-color: var(--app-canvas);

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: calc(var(--app-z-navbar) - 1);
    background-color: rgba(9, 14, 13, 0.45);
  }
}
</style>

