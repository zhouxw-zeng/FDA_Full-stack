<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Close, Lock, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { auditCustomer, fetchCustomers } from '@/api/customer';
import {
  AuditDialog,
  DataTable,
  PageHeader,
  SearchPanel,
  StatusTag,
  UserAvatar,
  type TableColumn,
} from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import {
  CUSTOMER_LEVEL_LABELS,
  CUSTOMER_LEVEL_OPTIONS,
  CUSTOMER_STATUS_OPTIONS,
} from '@/constants';
import type { Customer, CustomerQuery } from '@/types';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'CustomerApproval' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  Customer,
  CustomerQuery
>({
  fetcher: fetchCustomers,
  defaults: { keyword: '', status: '', level: '' },
});

const columns: TableColumn[] = [
  { prop: 'nickname', label: '用户', minWidth: 200, slot: 'nickname' },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'region', label: '地区', width: 90 },
  { prop: 'level', label: '等级', width: 100, slot: 'level', align: 'center' },
  { prop: 'dynamicCount', label: '发布动态', width: 100, align: 'center' },
  { prop: 'registeredAt', label: '注册时间', width: 150, slot: 'registeredAt' },
  { prop: 'status', label: '状态', width: 104, slot: 'status', align: 'center' },
  { prop: 'actions', label: '操作', width: 200, slot: 'actions', fixed: 'right' },
];

const selection = ref<Customer[]>([]);
const submitting = ref(false);

const auditState = reactive<{
  visible: boolean;
  action: 'approve' | 'reject';
  target: Customer | null;
}>({
  visible: false,
  action: 'approve',
  target: null,
});

const detailState = reactive<{ visible: boolean; target: Customer | null }>({
  visible: false,
  target: null,
});

const pendingSelection = computed(() => selection.value.filter((item) => item.status === 'pending'));

function openAudit(row: Customer, action: 'approve' | 'reject'): void {
  auditState.target = row;
  auditState.action = action;
  auditState.visible = true;
}

function openDetail(row: Customer): void {
  detailState.target = row;
  detailState.visible = true;
}

async function submitAudit(remark: string): Promise<void> {
  if (!auditState.target) {
    return;
  }
  submitting.value = true;
  try {
    await auditCustomer(auditState.target.id, {
      status: auditState.action === 'approve' ? 'approved' : 'rejected',
      remark,
    });
    ElMessage.success(auditState.action === 'approve' ? '已通过该用户' : '已驳回该用户');
    auditState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function banCustomer(row: Customer): Promise<void> {
  const accepted = await confirm(`封禁后「${row.nickname}」将无法登录 C 端，确定继续吗？`, {
    title: '封禁账号',
    confirmText: '封禁',
    danger: true,
  });
  if (!accepted) {
    return;
  }
  submitting.value = true;
  try {
    await auditCustomer(row.id, { status: 'banned', remark: '违反社区规范' });
    ElMessage.success('账号已封禁');
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function batchApprove(): Promise<void> {
  const targets = pendingSelection.value;
  if (targets.length === 0) {
    ElMessage.warning('请先勾选待审批的用户');
    return;
  }
  const accepted = await confirm(`将批量通过 ${targets.length} 位用户，确定继续吗？`, {
    title: '批量通过',
    confirmText: '全部通过',
  });
  if (!accepted) {
    return;
  }
  submitting.value = true;
  try {
    await Promise.all(
      targets.map((item) => auditCustomer(item.id, { status: 'approved', remark: '批量通过' })),
    );
    ElMessage.success(`已通过 ${targets.length} 位用户`);
    selection.value = [];
    await reload();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="customer-approval">
    <PageHeader title="C 端用户审批" description="核对注册资料，处理新用户审核与异常账号封禁">
      <template #actions>
        <el-button
          type="primary"
          :icon="Check"
          :disabled="pendingSelection.length === 0"
          :loading="submitting"
          @click="batchApprove"
        >
          批量通过（{{ pendingSelection.length }}）
        </el-button>
      </template>
    </PageHeader>

    <SearchPanel :loading="loading" @search="search" @reset="reset">
      <el-input
        v-model="query.keyword"
        placeholder="搜索昵称 / 手机号 / 邮箱"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-select v-model="query.status" placeholder="账号状态" clearable style="width: 140px">
        <el-option
          v-for="option in CUSTOMER_STATUS_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.level" placeholder="用户等级" clearable style="width: 140px">
        <el-option
          v-for="option in CUSTOMER_LEVEL_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </SearchPanel>

    <DataTable
      :data="list"
      :columns="columns"
      :loading="loading"
      :total="total"
      :page="query.page"
      :page-size="query.pageSize"
      selectable
      empty-text="没有符合条件的用户"
      @update:page="changePage"
      @update:page-size="changePageSize"
      @selection-change="selection = $event"
    >
      <template #nickname="{ row }">
        <div class="cell-user">
          <UserAvatar :nickname="(row as Customer).nickname" :src="(row as Customer).avatar" />
          <div class="cell-user__text">
            <strong>{{ (row as Customer).nickname }}</strong>
            <small>{{ (row as Customer).email }}</small>
          </div>
        </div>
      </template>

      <template #level="{ row }">
        <el-tag size="small" effect="plain" type="info">
          {{ CUSTOMER_LEVEL_LABELS[(row as Customer).level] }}
        </el-tag>
      </template>

      <template #registeredAt="{ row }">
        <span class="cell-time">{{ formatDateTime((row as Customer).registeredAt) }}</span>
      </template>

      <template #status="{ row }">
        <StatusTag kind="customer" :value="(row as Customer).status" />
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button
            link
            type="primary"
            :icon="View"
            @click="openDetail(row as Customer)"
          >
            详情
          </el-button>
          <el-button
            link
            type="success"
            :icon="Check"
            :disabled="(row as Customer).status === 'approved'"
            @click="openAudit(row as Customer, 'approve')"
          >
            通过
          </el-button>
          <el-button
            link
            type="danger"
            :icon="Close"
            :disabled="(row as Customer).status === 'rejected'"
            @click="openAudit(row as Customer, 'reject')"
          >
            驳回
          </el-button>
          <el-button
            link
            type="warning"
            :icon="Lock"
            :disabled="(row as Customer).status === 'banned'"
            @click="banCustomer(row as Customer)"
          >
            封禁
          </el-button>
        </div>
      </template>
    </DataTable>

    <AuditDialog
      v-model="auditState.visible"
      :action="auditState.action"
      :subject="auditState.target?.nickname"
      :loading="submitting"
      @submit="submitAudit"
    />

    <el-drawer v-model="detailState.visible" title="用户详情" size="440px" destroy-on-close>
      <div v-if="detailState.target" class="customer-detail">
        <div class="customer-detail__head">
          <UserAvatar
            :nickname="detailState.target.nickname"
            :src="detailState.target.avatar"
            :size="48"
          />
          <div>
            <strong>{{ detailState.target.nickname }}</strong>
            <small>{{ detailState.target.id }}</small>
          </div>
          <StatusTag kind="customer" :value="detailState.target.status" />
        </div>

        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="手机号">{{ detailState.target.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailState.target.email }}</el-descriptions-item>
          <el-descriptions-item label="所在地区">{{ detailState.target.region }}</el-descriptions-item>
          <el-descriptions-item label="用户等级">
            {{ CUSTOMER_LEVEL_LABELS[detailState.target.level] }}
          </el-descriptions-item>
          <el-descriptions-item label="发布动态">
            {{ detailState.target.dynamicCount }} 条
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(detailState.target.registeredAt) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detailState.target.auditRemark" label="审批意见">
            {{ detailState.target.auditRemark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailState.visible = false">关闭</el-button>
        <template v-if="detailState.target">
          <el-button
            type="danger"
            :icon="Close"
            @click="openAudit(detailState.target, 'reject')"
          >
            驳回
          </el-button>
          <el-button type="primary" :icon="Check" @click="openAudit(detailState.target, 'approve')">
            通过
          </el-button>
        </template>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.cell-user {
  display: flex;
  gap: 10px;
  align-items: center;

  &__text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    strong {
      color: var(--app-ink);
      font-weight: 500;
    }

    small {
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }
}

.cell-time {
  color: var(--app-ink-2);
  font-variant-numeric: tabular-nums;
}

.customer-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    gap: 12px;
    align-items: center;

    div {
      display: flex;
      flex: 1;
      flex-direction: column;
    }

    strong {
      color: var(--app-ink);
      font-size: 15px;
      font-weight: 600;
    }

    small {
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }
}
</style>
