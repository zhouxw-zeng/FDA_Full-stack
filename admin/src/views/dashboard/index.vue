<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import {
  ChatLineSquare,
  Promotion,
  TrendCharts,
  UserFilled,
  View,
} from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts';

import { fetchBehaviorAnalytics, fetchDashboardOverview, fetchRecentActivities } from '@/api/analytics';
import { ChartPanel, PageHeader, StatCard } from '@/components';
import { useChartTokens } from '@/composables/useChartTokens';
import { usePermissionStore } from '@/stores/permission';
import type { ActivityItem, BehaviorSeries, DashboardOverview } from '@/types';
import { formatCompactNumber, formatRelative } from '@/utils/format';
import { resolveMenuPath } from '@/utils/route';

defineOptions({ name: 'Dashboard' });

const permissionStore = usePermissionStore();
const tokens = useChartTokens();

const loading = ref(true);
const overview = ref<DashboardOverview | null>(null);
const activities = ref<ActivityItem[]>([]);
const series = ref<BehaviorSeries | null>(null);

const accessiblePaths = computed(() => {
  const paths = new Set<string>();
  const walk = (routes: RouteRecordRaw[], base: string): void => {
    routes.forEach((item) => {
      const fullPath = resolveMenuPath(base, item.path);
      paths.add(fullPath);
      if (item.children?.length) {
        walk(item.children, fullPath);
      }
    });
  };
  walk(permissionStore.menus, '');
  return paths;
});

const quickEntries = computed(() =>
  [
    {
      title: '论坛信息审批',
      description: '处理板块与帖子提交',
      path: '/forum/approval',
      icon: ChatLineSquare,
      badge: overview.value ? `${overview.value.pendingPosts} 条待处理` : '',
    },
    {
      title: 'C 端用户审批',
      description: '审核注册资料与账号状态',
      path: '/customer/approval',
      icon: UserFilled,
      badge: overview.value ? `${overview.value.pendingCustomers} 条待处理` : '',
    },
    {
      title: '广告推广管理',
      description: '配置投放计划与预算',
      path: '/advertising/list',
      icon: Promotion,
      badge: overview.value ? `${overview.value.runningAds} 个投放中` : '',
    },
    {
      title: '用户行为分析',
      description: '查看活跃与转化漏斗',
      path: '/analytics/behavior',
      icon: TrendCharts,
      badge: '',
    },
    {
      title: '动态预览',
      description: '按 C 端样式核对发布效果',
      path: '/preview/dynamic',
      icon: View,
      badge: '',
    },
  ].filter((item) => accessiblePaths.value.has(item.path)),
);

const trendOption = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
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
    data: series.value?.dates ?? [],
    axisLine: { lineStyle: { color: tokens.value.border } },
    axisLabel: { color: tokens.value.ink3 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: tokens.value.border, type: 'dashed' } },
    axisLabel: { color: tokens.value.ink3, formatter: (value: number) => `${value / 1000}k` },
  },
  series: [
    {
      name: '活跃用户',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: series.value?.activeUsers ?? [],
      lineStyle: { width: 2, color: tokens.value.primary },
      areaStyle: { color: `${tokens.value.primary}1f` },
      itemStyle: { color: tokens.value.primary },
    },
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: series.value?.newUsers ?? [],
      lineStyle: { width: 2, color: tokens.value.accent },
      itemStyle: { color: tokens.value.accent },
    },
  ],
}));

onMounted(async () => {
  loading.value = true;
  try {
    const [overviewData, activityData, analytics] = await Promise.all([
      fetchDashboardOverview(),
      fetchRecentActivities(),
      fetchBehaviorAnalytics(14),
    ]);
    overview.value = overviewData;
    activities.value = activityData;
    series.value = analytics.series;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard">
    <PageHeader title="工作台" description="平台内容、用户与商业化的实时概览" />

    <div class="dashboard__stats">
      <StatCard
        label="待审批论坛信息"
        :value="overview?.pendingPosts ?? 0"
        unit="条"
        tone="primary"
        :icon="ChatLineSquare"
      />
      <StatCard
        label="待审批 C 端用户"
        :value="overview?.pendingCustomers ?? 0"
        unit="人"
        tone="warning"
        :icon="UserFilled"
      />
      <StatCard
        label="今日新增动态"
        :value="overview?.todayDynamics ?? 0"
        unit="条"
        :trend="8.4"
        tone="success"
        :icon="View"
      />
      <StatCard
        label="素材总量"
        :value="formatCompactNumber(overview?.totalMedia ?? 0)"
        unit="个"
        :trend="-2.1"
        tone="info"
        :icon="Promotion"
      />
    </div>

    <div class="dashboard__panels">
      <ChartPanel
        title="近 14 天用户趋势"
        :option="trendOption"
        :loading="loading"
        :height="300"
        :empty="!series"
      />

      <section class="dashboard__activities">
        <header class="dashboard__section-head">
          <h3>最近操作</h3>
        </header>
        <el-scrollbar class="dashboard__activity-scroll">
          <el-timeline v-if="activities.length">
            <el-timeline-item
              v-for="item in activities"
              :key="item.id"
              :timestamp="formatRelative(item.createdAt)"
              placement="top"
              size="normal"
            >
              <p class="dashboard__activity-title">{{ item.title }}</p>
              <span class="dashboard__activity-operator">操作人：{{ item.operator }}</span>
            </el-timeline-item>
          </el-timeline>
          <p v-else class="dashboard__empty">暂无操作记录</p>
        </el-scrollbar>
      </section>
    </div>

    <section class="dashboard__shortcuts">
      <header class="dashboard__section-head">
        <h3>快捷入口</h3>
      </header>
      <div class="dashboard__shortcut-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.path"
          type="button"
          class="dashboard__shortcut"
          @click="$router.push(entry.path)"
        >
          <span class="dashboard__shortcut-icon">
            <el-icon><component :is="entry.icon" /></el-icon>
          </span>
          <span class="dashboard__shortcut-text">
            <strong>{{ entry.title }}</strong>
            <small>{{ entry.description }}</small>
          </span>
          <span v-if="entry.badge" class="dashboard__shortcut-badge">{{ entry.badge }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  &__panels {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    gap: 16px;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__activities,
  &__shortcuts {
    padding: 16px;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
  }

  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 {
      color: var(--app-ink);
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__activity-scroll {
    height: 268px;
  }

  &__activity-title {
    color: var(--app-ink);
    font-size: 13px;
  }

  &__activity-operator {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__empty {
    padding: 32px 0;
    color: var(--app-ink-3);
    text-align: center;
  }

  &__shortcut-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  &__shortcut {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background-color: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);

    &:hover {
      border-color: var(--app-primary);
    }
  }

  &__shortcut-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--app-primary);
    background-color: var(--app-primary-weak);
    border-radius: var(--app-radius);
  }

  &__shortcut-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    strong {
      color: var(--app-ink);
      font-size: 13px;
      font-weight: 600;
    }

    small {
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }

  &__shortcut-badge {
    flex-shrink: 0;
    color: var(--app-accent);
    font-size: 12px;
  }
}
</style>
