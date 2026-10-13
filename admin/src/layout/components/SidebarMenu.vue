<script setup lang="ts">
import { computed } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { resolveMenuPath } from '@/utils/route';

defineOptions({ name: 'SidebarMenu' });

const props = defineProps<{
  route: RouteRecordRaw;
  basePath: string;
}>();

const fullPath = computed(() => resolveMenuPath(props.basePath, props.route.path));

const visibleChildren = computed(
  () => props.route.children?.filter((child) => !child.meta?.hidden) ?? [],
);

/**
 * 只有一个子路由时直接渲染成菜单项（用子路由的标题和图标），
 * 这样「工作台」「C 端用户审批」这类单项分组不会多出一层无意义的下拉。
 * 只有两个及以上子路由才折叠成子菜单。
 */
const singleChild = computed(() =>
  visibleChildren.value.length === 1 ? visibleChildren.value[0] : null,
);

const renderAsItem = computed(() => visibleChildren.value.length === 0 || singleChild.value !== null);

const itemRoute = computed<RouteRecordRaw>(() => singleChild.value ?? props.route);

/** 单项分组时优先用子路由图标，没有则回退到分组图标，保证菜单视觉对齐 */
const itemIcon = computed(() => itemRoute.value.meta?.icon ?? props.route.meta?.icon);

const itemPath = computed(() =>
  singleChild.value ? resolveMenuPath(fullPath.value, singleChild.value.path) : fullPath.value,
);
</script>

<template>
  <el-menu-item v-if="renderAsItem" :index="itemPath">
    <el-icon v-if="itemIcon"><component :is="itemIcon" /></el-icon>
    <template #title>{{ itemRoute.meta?.title ?? props.route.meta?.title }}</template>
  </el-menu-item>

  <el-sub-menu v-else :index="fullPath">
    <template #title>
      <el-icon v-if="props.route.meta?.icon"><component :is="props.route.meta.icon" /></el-icon>
      <span>{{ props.route.meta?.title }}</span>
    </template>

    <SidebarMenu v-for="child in visibleChildren" :key="child.path" :route="child" :base-path="fullPath" />
  </el-sub-menu>
</template>
