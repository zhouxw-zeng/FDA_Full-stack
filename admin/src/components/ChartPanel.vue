<script setup lang="ts">
import { BarChart, FunnelChart, LineChart, PieChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';

import EmptyState from './EmptyState.vue';

defineOptions({ name: 'ChartPanel' });

const props = withDefaults(
  defineProps<{
    option: EChartsOption;
    title?: string;
    height?: number | string;
    loading?: boolean;
    empty?: boolean;
    emptyText?: string;
  }>(),
  {
    title: '',
    height: 300,
    loading: false,
    empty: false,
    emptyText: '暂无数据',
  },
);

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
]);
</script>

<template>
  <section class="chart-panel">
    <header v-if="props.title || $slots.extra" class="chart-panel__head">
      <h3 class="chart-panel__title">{{ props.title }}</h3>
      <div class="chart-panel__extra">
        <slot name="extra" />
      </div>
    </header>
    <div
      v-loading="props.loading"
      class="chart-panel__body"
      :style="{ height: typeof props.height === 'number' ? `${props.height}px` : props.height }"
    >
      <EmptyState v-if="props.empty" :description="props.emptyText" />
      <VChart v-else class="chart-panel__chart" :option="props.option" autoresize />
    </div>
  </section>
</template>

<style scoped lang="scss">
.chart-panel {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);

  &__head {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__title {
    color: var(--app-ink);
    font-size: 14px;
    font-weight: 600;
  }

  &__extra {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__body {
    min-height: 160px;
  }

  &__chart {
    width: 100%;
    height: 100%;
  }
}
</style>

