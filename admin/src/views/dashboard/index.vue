<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { ChatLineSquare, Promotion, UserFilled, View } from '@element-plus/icons-vue';

import { fetchAds } from '@/api/ad';
import { fetchCustomers } from '@/api/customer';
import { fetchForumChangeLogs, fetchForumDynamics } from '@/api/forum';
import { EmptyState, PageHeader, StatCard } from '@/components';
import { CHANGE_ACTION_LABELS } from '@/constants';
import { usePermissionStore } from '@/stores/permission';
import type { ForumChangeLog } from '@/types';
import { formatDateTime, formatRelative } from '@/utils/format';
import { resolveMenuPath } from '@/utils/route';

defineOptions({ name: 'Dashboard' });

const permissionStore = usePermissionStore();

const loading = ref(true);
const pendingDynamics = ref(0);
const pendingCustomers = ref(0);
const runningAds = ref(0);
const totalDynamics = ref(0);
const logs = ref<ForumChangeLog[]>([]);

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
      description: '处理待审核的社区动态',
      path: '/forum/approval',
      icon: ChatLineSquare,
      badge: `${pendingDynamics.value} 条待处理`,
    },
    {
      title: 'C 端用户审批',
      description: '核对注册资料与账号状态',
      path: '/customer/approval',
      icon: UserFilled,
      badge: `${pendingCustomers.value} 条待处理`,
    },
    {
      title: '广告推广管理',
      description: '配置投放计划与预算',
      path: '/advertising/list',
      icon: Promotion,
      badge: `${runningAds.value} 个投放中`,
    },
    {
      title: '论坛动态',
      description: '下架违规内容或重新上架',
      path: '/forum/dynamics',
      icon: View,
      badge: '',
    },
  ].filter((item) => accessiblePaths.value.has(item.path)),
);

onMounted(async () => {
  loading.value = true;
  try {
    // 统计口径来自列表接口的 total，避免为看板额外造一套后端接口
    const [pendingDynamicPage, pendingCustomerPage, runningAdPage, dynamicPage, logPage] =
      await Promise.all([
        fetchForumDynamics({ page: 1, size: 1, auditStatus: 'pending' }),
        fetchCustomers({ page: 1, size: 1, auditStatus: 'pending' }),
        fetchAds({ page: 1, size: 1, status: 'running' }),
        fetchForumDynamics({ page: 1, size: 1 }),
        fetchForumChangeLogs({ page: 1, size: 12 }),
      ]);

    pendingDynamics.value = pendingDynamicPage.total;
    pendingCustomers.value = pendingCustomerPage.total;
    runningAds.value = runningAdPage.total;
    totalDynamics.value = dynamicPage.total;
    logs.value = logPage.list;
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
        label="待审论坛动态"
        :value="pendingDynamics"
        unit="条"
        tone="primary"
        :icon="ChatLineSquare"
      />
      <StatCard
        label="待审 C 端用户"
        :value="pendingCustomers"
        unit="人"
        tone="warning"
        :icon="UserFilled"
      />
      <StatCard
        label="投放中广告计划"
        :value="runningAds"
        unit="个"
        tone="accent"
        :icon="Promotion"
      />
      <StatCard
        label="社区动态总量"
        :value="totalDynamics"
        unit="条"
        tone="info"
        :icon="View"
      />
    </div>

    <div class="dashboard__panels">
      <section class="dashboard__panel">
        <header class="dashboard__section-head">
          <h3>最近操作</h3>
          <span class="dashboard__hint">来源：动态变更日志</span>
        </header>
        <el-scrollbar class="dashboard__scroll">
          <el-skeleton v-if="loading" :rows="5" animated />
          <EmptyState v-else-if="logs.length === 0" description="暂无操作记录" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="log in logs"
              :key="log.id"
              :timestamp="formatRelative(log.changedAt)"
              placement="top"
              size="normal"
            >
              <p class="dashboard__log-title">
                {{ CHANGE_ACTION_LABELS[log.action] ?? log.action }}动态 {{ log.targetId }}
              </p>
              <el-tooltip :content="formatDateTime(log.changedAt)" placement="top">
                <span class="dashboard__log-meta">
                  {{ log.editorType === 'admin' ? '管理员' : '用户' }} #{{ log.editorId }}
                  <template v-if="log.remark"> · {{ log.remark }}</template>
                </span>
              </el-tooltip>
            </el-timeline-item>
          </el-timeline>
        </el-scrollbar>
      </section>

      <section class="dashboard__panel">
        <header class="dashboard__section-head">
          <h3>快捷入口</h3>
        </header>
        <div class="dashboard__shortcuts">
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
    grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr);
    gap: 16px;
    align-items: start;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__panel {
    padding: 16px;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
  }

  &__section-head {
    display: flex;
    gap: 12px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 {
      color: var(--app-ink);
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__hint {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__scroll {
    height: 340px;
  }

  &__log-title {
    color: var(--app-ink);
    font-size: 13px;
  }

  &__log-meta {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__shortcuts {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
