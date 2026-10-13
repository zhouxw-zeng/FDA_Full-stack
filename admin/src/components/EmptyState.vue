<script setup lang="ts">
import { Box } from '@element-plus/icons-vue';

defineOptions({ name: 'EmptyState' });

withDefaults(
  defineProps<{
    description?: string;
    compact?: boolean;
  }>(),
  {
    description: '暂无数据',
    compact: true,
  },
);
</script>

<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <el-icon class="empty-state__icon"><Box /></el-icon>
    <p class="empty-state__text">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--app-ink-3);

  &--compact {
    padding: 28px 16px;
  }

  &__icon {
    font-size: 28px;
    color: var(--app-border-strong);
  }

  &__text {
    font-size: 13px;
  }
}
</style>

