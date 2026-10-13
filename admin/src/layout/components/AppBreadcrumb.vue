<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ name: 'AppBreadcrumb' });

const route = useRoute();

const items = computed(() =>
  route.matched
    .filter((item) => item.meta?.title && item.meta.breadcrumb !== false)
    .map((item) => item.meta.title as string),
);
</script>

<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="(item, index) in items" :key="`${item}-${index}`">
      {{ item }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped lang="scss">
:deep(.el-breadcrumb) {
  font-size: 13px;
}

:deep(.el-breadcrumb__inner) {
  color: var(--app-ink-3);
  font-weight: 400;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--app-ink);
  font-weight: 500;
}

@media (max-width: 720px) {
  :deep(.el-breadcrumb) {
    display: none;
  }
}
</style>

