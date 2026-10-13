<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Close, Lock, Unlock, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { auditCustomer, fetchCustomerDetail, fetchCustomers, updateCustomerStatus } from '@/api/customer';
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
  AUDIT_STATUS_OPTIONS,
  ENABLED_OPTIONS,
  GENDER_LABELS,
  VIP_LEVEL_LABELS,
  VIP_LEVEL_OPTIONS,
} from '@/constants';
import type { Customer, CustomerQuery } from '@/types';
import { formatDate, formatDateTime } from '@/utils/format';

defineOptions({ name: 'CustomerApproval' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  Customer,
  CustomerQuery
>({
  fetcher: fetchCustomers,
  defaults: { keyword: '', auditStatus: '', vipLevel: '', enabled: '' },
});

const columns: TableColumn[] = [
  { prop: 'nickname', label: '用户', minWidth: 200, slot: 'nickname' },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'region', label: '地区', width: 90, slot: 'region' },
  { prop: 'vipLevel', label: 'VIP', width: 90, slot: 'vipLevel', align: 'center' },
  { prop: 'dynamicCount', label: '动态数', width: 90, align: 'center' },
  { prop: 'createdAt', label: '注册时间', width: 140, slot: 'createdAt' },
  { prop: 'auditStatus', label: '审核', width: 96, slot: 'auditStatus', align: 'center' },
  { prop: 'enabled', label: '状态', width: 96, slot: 'enabled', align: 'center' },
  { prop: 'actions', label: '操作', width: 210, slot: 'actions', fixed: 'right' },
];

const selection = ref<Customer[]>([]);
const submitting = ref(false);

const auditState = reactive<{
  visible: boolean;
  action: 'approve' | 'reject';
  target: Customer | null;
}>({ visible: false, action: 'approve', target: null });

const detailState = reactive<{ visible: boolean; target: Customer | null }>({
  visible: false,
  target: null,
});

const pendingSelection = computed(() =>
  selection.value.filter((item) => item.auditStatus === 'pending'),
);

function openAudit(row: Customer, action: 'approve' | 'reject'): void {
  auditState.target = row;
  auditState.action = action;
  auditState.visible = true;
}

async function openDetail(row: Customer): Promise<void> {
  detailState.target = row;
  detailState.visible = true;
  detailState.target = await fetchCustomerDetail(row.id);
}

async function submitAudit(remark: string): Promise<void> {
  if (!auditState.target) {
    return;
  }
  submitting.value = true;
  try {
    const updated = await auditCustomer({
      id: auditState.target.id,
      status: auditState.action === 'approve' ? 'approved' : 'rejected',
      remark,
    });
    ElMessage.success(auditState.action === 'approve' ? '已通过该用户资料' : '已驳回该用户资料');
    auditState.visible = false;
    if (detailState.visible && detailState.target?.id === updated.id) {
      detailState.target = updated;
    }
    await reload();
  } finally {
    submitting.value = false;
  }
}

/** 启用 / 禁用：对应后端 PUT /customers/status */
async function toggleEnabled(row: Customer): Promise<void> {
  const next = row.enabled === 1 ? 0 : 1;
  const accepted = await confirm(
    next === 1
      ? `启用后「${row.nickname}」可以正常登录 C 端，确定继续吗？`
      : `禁用后「${row.nickname}」将无法登录 C 端，确定继续吗？`,
    {
      title: next === 1 ? '启用账号' : '禁用账号',
      confirmText: next === 1 ? '启用' : '禁用',
      danger: next === 0,
    },
  );
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    const updated = await updateCustomerStatus({ id: row.id, enabled: next });
    ElMessage.success(next === 1 ? '账号已启用' : '账号已禁用');
    if (detailState.visible && detailState.target?.id === updated.id) {
      detailState.target = updated;
    }
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
      targets.map((item) =>
        auditCustomer({ id: item.id, status: 'approved', remark: '批量通过' }),
      ),
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
    <PageHeader title="C 端用户审批" description="核对注册资料，处理用户审核与账号启停">
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
      <el-select v-model="query.auditStatus" placeholder="审核状态" clearable style="width: 140px">
        <el-option
          v-for="option in AUDIT_STATUS_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.vipLevel" placeholder="VIP 等级" clearable style="width: 130px">
        <el-option
          v-for="option in VIP_LEVEL_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="Number(option.value)"
        />
      </el-select>
      <el-select v-model="query.enabled" placeholder="账号状态" clearable style="width: 130px">
        <el-option
          v-for="option in ENABLED_OPTIONS"
          :key="option.label"
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
      :page-size="query.size"
      selectable
      empty-text="没有符合条件的用户"
      @update:page="changePage"
      @update:page-size="changePageSize"
      @selection-change="selection = $event"
    >
      <template #nickname="{ row }">
        <div class="cell-user">
          <UserAvatar
            :nickname="(row as Customer).nickname"
            :src="(row as Customer).avatar || undefined"
          />
          <div class="cell-user__text">
            <strong>{{ (row as Customer).nickname }}</strong>
            <small>{{ (row as Customer).username ?? '未设置账号名' }}</small>
          </div>
        </div>
      </template>

      <template #region="{ row }">
        <span>{{ (row as Customer).region ?? '-' }}</span>
      </template>

      <template #vipLevel="{ row }">
        <el-tag size="small" effect="plain" type="warning">
          {{ VIP_LEVEL_LABELS[(row as Customer).vipLevel] ?? `VIP${(row as Customer).vipLevel}` }}
        </el-tag>
      </template>

      <template #createdAt="{ row }">
        <span class="cell-time">{{ formatDate((row as Customer).createdAt) }}</span>
      </template>

      <template #auditStatus="{ row }">
        <StatusTag kind="audit" :value="(row as Customer).auditStatus" />
      </template>

      <template #enabled="{ row }">
        <StatusTag kind="customerEnabled" :value="(row as Customer).enabled" />
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as Customer)">
            详情
          </el-button>
          <el-button
            link
            type="success"
            :icon="Check"
            :disabled="(row as Customer).auditStatus === 'approved'"
            @click="openAudit(row as Customer, 'approve')"
          >
            通过
          </el-button>
          <el-button
            link
            type="danger"
            :icon="Close"
            :disabled="(row as Customer).auditStatus === 'rejected'"
            @click="openAudit(row as Customer, 'reject')"
          >
            驳回
          </el-button>
          <el-button
            link
            :type="(row as Customer).enabled === 1 ? 'warning' : 'success'"
            :icon="(row as Customer).enabled === 1 ? Lock : Unlock"
            @click="toggleEnabled(row as Customer)"
          >
            {{ (row as Customer).enabled === 1 ? '禁用' : '启用' }}
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

    <el-drawer v-model="detailState.visible" title="用户详情" size="460px" destroy-on-close>
      <div v-if="detailState.target" class="customer-detail">
        <div class="customer-detail__head">
          <UserAvatar
            :nickname="detailState.target.nickname"
            :src="detailState.target.avatar || undefined"
            :size="48"
          />
          <div>
            <strong>{{ detailState.target.nickname }}</strong>
            <small>{{ detailState.target.username ?? `#${detailState.target.id}` }}</small>
          </div>
          <StatusTag kind="customerEnabled" :value="detailState.target.enabled" />
        </div>

        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="审核状态">
            <StatusTag kind="audit" :value="detailState.target.auditStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailState.target.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ detailState.target.email ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ GENDER_LABELS[detailState.target.gender] ?? '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="生日">
            {{ detailState.target.birthday ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="地区">
            {{ detailState.target.region ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="VIP 等级">
            {{ VIP_LEVEL_LABELS[detailState.target.vipLevel] ?? detailState.target.vipLevel }}
          </el-descriptions-item>
          <el-descriptions-item label="动态数量">
            {{ detailState.target.dynamicCount }} 条
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(detailState.target.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最近登录">
            {{ formatDateTime(detailState.target.lastLoginAt) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detailState.target.signature" label="个性签名">
            {{ detailState.target.signature }}
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
