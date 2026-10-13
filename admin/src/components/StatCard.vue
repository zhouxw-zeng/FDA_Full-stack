<script setup lang="ts">
import { computed, type Component } from 'vue';
import { BottomRight, TopRight } from '@element-plus/icons-vue';

defineOptions({ name: 'StatCard' });

const props = withDefaults(
  defineProps<{
    label: string;
    value: number | string;
    unit?: string;
    trend?: number;
    icon?: Component;
    tone?: 'primary' | 'accent' | 'success' | 'warning' | 'info';
  }>(),
  {
    unit: '',
    trend: undefined,
    icon: undefined,
    tone: 'primary',
  },
);

const trendUp = computed(() => (props.trend ?? 0) >= 0);
</script>

<template>
  <article class="stat-card" :class="`stat-card--${props.tone}`">
    <div class="stat-card__head">
      <span class="stat-card__label">{{ props.label }}</span>
      <span v-if="props.icon" class="stat-card__icon">
        <el-icon><component :is="props.icon" /></el-icon>
      </span>
    </div>
    <div class="stat-card__value">
      {{ props.value }}
      <small v-if="props.unit">{{ props.unit }}</small>
    </div>
    <div v-if="props.trend !== undefined" class="stat-card__trend" :class="{ 'is-down': !trendUp }">
      <el-icon><component :is="trendUp ? TopRight : BottomRight" /></el-icon>
      <span>{{ Math.abs(props.trend) }}%</span>
      <span class="stat-card__trend-note">较上周期</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);

  /* 左侧色条区分指标类别，避免整块大面积上色 */
  border-left: 3px solid var(--tone-color, var(--app-primary));

  &--accent {
    --tone-color: var(--app-accent);
  }

  &--success {
    --tone-color: var(--app-success);
  }

  &--warning {
    --tone-color: var(--app-warning);
  }

  &--info {
    --tone-color: var(--app-info);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    color: var(--app-ink-3);
    font-size: 13px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--tone-color, var(--app-primary));
    background-color: color-mix(in srgb, var(--tone-color, var(--app-primary)) 12%, transparent);
    border-radius: var(--app-radius);
  }

  &__value {
    color: var(--app-ink);
    font-size: 24px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.25;

    small {
      margin-left: 4px;
      color: var(--app-ink-3);
      font-size: 12px;
      font-weight: 400;
    }
  }

  &__trend {
    display: flex;
    gap: 4px;
    align-items: center;
    color: var(--app-success);
    font-size: 12px;

    &.is-down {
      color: var(--app-danger);
    }
  }

  &__trend-note {
    color: var(--app-ink-3);
  }
}
</style>
