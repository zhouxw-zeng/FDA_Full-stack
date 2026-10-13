<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue';

defineOptions({ name: 'SearchPanel' });

withDefaults(
  defineProps<{
    loading?: boolean;
    searchText?: string;
    resetText?: string;
  }>(),
  {
    loading: false,
    searchText: '查询',
    resetText: '重置',
  },
);

const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <section class="search-panel">
    <div class="search-panel__fields">
      <slot />
    </div>
    <div class="search-panel__actions">
      <el-button type="primary" :icon="Search" :loading="loading" @click="emit('search')">
        {{ searchText }}
      </el-button>
      <el-button :icon="Refresh" @click="emit('reset')">{{ resetText }}</el-button>
      <slot name="extra" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.search-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 16px;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);

  &__fields {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 12px 16px;
    align-items: center;
    min-width: 0;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  @media (max-width: 720px) {
    flex-direction: column;

    &__fields,
    &__actions {
      width: 100%;
    }
  }
}
</style>
