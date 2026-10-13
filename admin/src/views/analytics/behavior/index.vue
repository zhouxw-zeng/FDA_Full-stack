<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Clock, TrendCharts, User, UserFilled } from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts';

import { fetchBehaviorAnalytics } from '@/api/analytics';
import { ChartPanel, PageHeader, StatCard } from '@/components';
import { useChartTokens } from '@/composables/useChartTokens';
import type { BehaviorAnalytics } from '@/types';
import { formatCompactNumber } from '@/utils/format';

defineOptions({ name: 'AnalyticsBehavior' });

const tokens = useChartTokens();

const loading = ref(true);
const range = ref(14);
const analytics = ref<BehaviorAnalytics | null>(null);

const rangeOptions = [
  { label: '近 7 天', value: 7 },
  { label: '近 14 天', value: 14 },
  { label: '近 30 天', value: 30 },
];

const axisLabel = computed(() => ({ color: tokens.value.ink3 }));
const splitLine = computed(() => ({
  lineStyle: { color: tokens.value.border, type: 'dashed' as const },
}));

const trendOption = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
  tooltip: { trigger: 'axis' },
  legend: {
    top: 0,
    right: 0,
    icon: 'roundRect',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: tokens.value.ink3 },
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: analytics.value?.series.dates ?? [],
    axisLine: { lineStyle: { color: tokens.value.border } },
    axisLabel: axisLabel.value,
  },
  yAxis: {
    type: 'value',
    splitLine: splitLine.value,
    axisLabel: axisLabel.value,
  },
  series: [
    {
      name: '活跃用户',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: analytics.value?.series.activeUsers ?? [],
      lineStyle: { width: 2, color: tokens.value.primary },
      areaStyle: { color: `${tokens.value.primary}1f` },
      itemStyle: { color: tokens.value.primary },
    },
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: analytics.value?.series.newUsers ?? [],
      lineStyle: { width: 2, color: tokens.value.accent },
      itemStyle: { color: tokens.value.accent },
    },
  ],
}));

const funnelOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}' },
  series: [
    {
      type: 'funnel',
      left: '6%',
      width: '88%',
      minSize: '24%',
      gap: 2,
      label: { position: 'inside', color: '#fff', fontSize: 12 },
      itemStyle: { borderWidth: 0 },
      color: [tokens.value.primary, '#3f9486', '#5aa89b', tokens.value.info, tokens.value.accent],
      data: analytics.value?.funnel ?? [],
    },
  ],
}));

const deviceOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}（{d}%）' },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: tokens.value.ink3 },
  },
  series: [
    {
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      label: { show: false },
      itemStyle: { borderColor: tokens.value.surface, borderWidth: 2 },
      color: [tokens.value.primary, tokens.value.info, tokens.value.accent, tokens.value.warning],
      data: analytics.value?.distribution.devices ?? [],
    },
  ],
}));

const regionOption = computed<EChartsOption>(() => {
  const regions = [...(analytics.value?.distribution.regions ?? [])].sort(
    (a, b) => a.value - b.value,
  );
  return {
    grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      splitLine: splitLine.value,
      axisLabel: axisLabel.value,
    },
    yAxis: {
      type: 'category',
      data: regions.map((item) => item.name),
      axisLine: { lineStyle: { color: tokens.value.border } },
      axisLabel: axisLabel.value,
    },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: regions.map((item) => item.value),
        itemStyle: { color: tokens.value.info, borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
});

const hourOption = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: analytics.value?.distribution.hours.map((item) => item.name) ?? [],
    axisLine: { lineStyle: { color: tokens.value.border } },
    axisLabel: axisLabel.value,
  },
  yAxis: {
    type: 'value',
    splitLine: splitLine.value,
    axisLabel: axisLabel.value,
  },
  series: [
    {
      type: 'bar',
      barWidth: '52%',
      data: analytics.value?.distribution.hours.map((item) => item.value) ?? [],
      itemStyle: { color: tokens.value.primary, borderRadius: [4, 4, 0, 0] },
    },
  ],
}));

async function load(): Promise<void> {
  loading.value = true;
  try {
    analytics.value = await fetchBehaviorAnalytics(range.value);
  } finally {
    loading.value = false;
  }
}

function handleRangeChange(value: string | number | boolean | undefined): void {
  range.value = Number(value);
  void load();
}

onMounted(load);
</script>

<template>
  <div class="behavior">
    <PageHeader title="用户行为分析" description="按时间段查看用户活跃、转化漏斗与分布特征">
      <template #actions>
        <el-radio-group :model-value="range" size="default" @change="handleRangeChange">
          <el-radio-button v-for="option in rangeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </template>
    </PageHeader>

    <div class="behavior__stats">
      <StatCard
        label="日活用户"
        :value="formatCompactNumber(analytics?.overview.activeUsers ?? 0)"
        :trend="analytics?.overview.trend.activeUsers"
        :icon="UserFilled"
        tone="primary"
      />
      <StatCard
        label="新增用户"
        :value="formatCompactNumber(analytics?.overview.newUsers ?? 0)"
        :trend="analytics?.overview.trend.newUsers"
        :icon="User"
        tone="accent"
      />
      <StatCard
        label="人均停留"
        :value="analytics?.overview.avgDuration ?? 0"
        unit="秒"
        :trend="analytics?.overview.trend.avgDuration"
        :icon="Clock"
        tone="info"
      />
      <StatCard
        label="次日留存"
        :value="analytics?.overview.retentionRate ?? 0"
        unit="%"
        :trend="analytics?.overview.trend.retentionRate"
        :icon="TrendCharts"
        tone="success"
      />
    </div>

    <ChartPanel
      title="活跃与新增趋势"
      :option="trendOption"
      :loading="loading"
      :height="320"
      :empty="!analytics"
    />

    <div class="behavior__grid">
      <ChartPanel
        title="行为转化漏斗"
        :option="funnelOption"
        :loading="loading"
        :height="300"
        :empty="!analytics"
      />
      <ChartPanel
        title="设备分布"
        :option="deviceOption"
        :loading="loading"
        :height="300"
        :empty="!analytics"
      />
      <ChartPanel
        title="地域分布 TOP 8"
        :option="regionOption"
        :loading="loading"
        :height="300"
        :empty="!analytics"
      />
      <ChartPanel
        title="活跃时段分布"
        :option="hourOption"
        :loading="loading"
        :height="300"
        :empty="!analytics"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.behavior {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 16px;
  }
}
</style>
