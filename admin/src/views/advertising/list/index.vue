<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Delete, Edit, Plus, VideoPause, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

import { createAd, deleteAd, fetchAds, updateAd, updateAdStatus } from '@/api/ad';
import { DataTable, PageHeader, SearchPanel, StatusTag, type TableColumn } from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import {
  AD_PLACEMENT_LABELS,
  AD_PLACEMENT_OPTIONS,
  AD_STATUS_OPTIONS,
} from '@/constants';
import type { AdCampaign, AdCampaignPayload, AdQuery } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

defineOptions({ name: 'AdvertisingList' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  AdCampaign,
  AdQuery
>({
  fetcher: fetchAds,
  defaults: { keyword: '', placement: '', status: '' },
});

const columns: TableColumn[] = [
  { prop: 'name', label: '投放计划', minWidth: 220, slot: 'name' },
  { prop: 'advertiser', label: '广告主', width: 150 },
  { prop: 'placement', label: '投放位置', width: 110, slot: 'placement' },
  { prop: 'budget', label: '预算消耗', width: 180, slot: 'budget' },
  { prop: 'performance', label: '曝光 / 点击', width: 150, slot: 'performance' },
  { prop: 'period', label: '投放周期', width: 200, slot: 'period' },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' },
  { prop: 'actions', label: '操作', width: 200, slot: 'actions', fixed: 'right' },
];

const submitting = ref(false);
const formRef = ref<FormInstance>();

const dialogState = reactive<{ visible: boolean; mode: 'create' | 'edit'; id: string }>({
  visible: false,
  mode: 'create',
  id: '',
});

const form = reactive<AdCampaignPayload>({
  name: '',
  advertiser: '',
  placement: 'feed',
  budget: 10_000,
  startAt: '',
  endAt: '',
});

const dateRange = ref<[string, string] | null>(null);

const rules: FormRules<AdCampaignPayload> = {
  name: [{ required: true, message: '请输入投放计划名称', trigger: 'blur' }],
  advertiser: [{ required: true, message: '请输入广告主名称', trigger: 'blur' }],
  budget: [{ required: true, message: '请输入预算金额', trigger: 'blur' }],
};

const dialogTitle = computed(() => (dialogState.mode === 'create' ? '新建投放计划' : '编辑投放计划'));

function resetForm(): void {
  form.name = '';
  form.advertiser = '';
  form.placement = 'feed';
  form.budget = 10_000;
  form.startAt = '';
  form.endAt = '';
  dateRange.value = null;
}

function openCreate(): void {
  dialogState.mode = 'create';
  dialogState.id = '';
  resetForm();
  dialogState.visible = true;
}

function openEdit(row: AdCampaign): void {
  dialogState.mode = 'edit';
  dialogState.id = row.id;
  form.name = row.name;
  form.advertiser = row.advertiser;
  form.placement = row.placement;
  form.budget = row.budget;
  form.startAt = row.startAt;
  form.endAt = row.endAt;
  dateRange.value = [row.startAt.slice(0, 10), row.endAt.slice(0, 10)];
  dialogState.visible = true;
}

async function submitForm(): Promise<void> {
  if (!formRef.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!dateRange.value) {
    ElMessage.warning('请选择投放周期');
    return;
  }

  form.startAt = dateRange.value[0];
  form.endAt = dateRange.value[1];

  submitting.value = true;
  try {
    if (dialogState.mode === 'create') {
      await createAd({ ...form });
      ElMessage.success('投放计划已创建');
    } else {
      await updateAd(dialogState.id, { ...form });
      ElMessage.success('投放计划已更新');
    }
    dialogState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: AdCampaign): Promise<void> {
  const next = row.status === 'running' ? 'paused' : 'running';
  const accepted = await confirm(
    next === 'running'
      ? `启用后「${row.name}」将立即对用户展示，确定继续吗？`
      : `暂停后「${row.name}」将停止曝光，确定继续吗？`,
    {
      title: next === 'running' ? '启用投放' : '暂停投放',
      confirmText: next === 'running' ? '启用' : '暂停',
    },
  );
  if (!accepted) {
    return;
  }
  submitting.value = true;
  try {
    await updateAdStatus(row.id, next);
    ElMessage.success(next === 'running' ? '已启用投放' : '已暂停投放');
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function removeAd(row: AdCampaign): Promise<void> {
  const accepted = await confirm(`删除后「${row.name}」的投放数据不可恢复，确定删除吗？`, {
    title: '删除投放计划',
    confirmText: '删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }
  submitting.value = true;
  try {
    await deleteAd(row.id);
    ElMessage.success('投放计划已删除');
    await reload();
  } finally {
    submitting.value = false;
  }
}

function ctr(row: AdCampaign): string {
  if (row.impressions === 0) {
    return '0.00%';
  }
  return `${((row.clicks / row.impressions) * 100).toFixed(2)}%`;
}
</script>

<template>
  <div class="advertising">
    <PageHeader title="广告推广管理" description="维护广告主的投放计划、预算与投放状态">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建投放计划</el-button>
      </template>
    </PageHeader>

    <SearchPanel :loading="loading" @search="search" @reset="reset">
      <el-input
        v-model="query.keyword"
        placeholder="搜索计划名称 / 广告主"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-select v-model="query.placement" placeholder="投放位置" clearable style="width: 150px">
        <el-option
          v-for="option in AD_PLACEMENT_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.status" placeholder="投放状态" clearable style="width: 140px">
        <el-option
          v-for="option in AD_STATUS_OPTIONS"
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
      empty-text="没有符合条件的投放计划"
      @update:page="changePage"
      @update:page-size="changePageSize"
    >
      <template #name="{ row }">
        <div class="cell-plan">
          <strong>{{ (row as AdCampaign).name }}</strong>
          <small>{{ (row as AdCampaign).id }}</small>
        </div>
      </template>

      <template #placement="{ row }">
        <el-tag size="small" effect="plain" type="info">
          {{ AD_PLACEMENT_LABELS[(row as AdCampaign).placement] }}
        </el-tag>
      </template>

      <template #budget="{ row }">
        <div class="cell-budget">
          <span class="cell-budget__text">
            {{ formatCurrency((row as AdCampaign).spent) }} /
            {{ formatCurrency((row as AdCampaign).budget) }}
          </span>
          <el-progress
            :percentage="
              Math.min(
                100,
                Math.round(((row as AdCampaign).spent / (row as AdCampaign).budget) * 100),
              )
            "
            :show-text="false"
            :stroke-width="4"
          />
        </div>
      </template>

      <template #performance="{ row }">
        <div class="cell-performance">
          <span>{{ (row as AdCampaign).impressions.toLocaleString('zh-CN') }} 次曝光</span>
          <small>点击率 {{ ctr(row as AdCampaign) }}</small>
        </div>
      </template>

      <template #period="{ row }">
        <span class="cell-period">
          {{ formatDate((row as AdCampaign).startAt) }} ~ {{ formatDate((row as AdCampaign).endAt) }}
        </span>
      </template>

      <template #status="{ row }">
        <StatusTag kind="ad" :value="(row as AdCampaign).status" />
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="Edit" @click="openEdit(row as AdCampaign)">
            编辑
          </el-button>
          <el-button
            link
            :type="(row as AdCampaign).status === 'running' ? 'warning' : 'success'"
            :icon="(row as AdCampaign).status === 'running' ? VideoPause : VideoPlay"
            :disabled="(row as AdCampaign).status === 'ended'"
            @click="toggleStatus(row as AdCampaign)"
          >
            {{ (row as AdCampaign).status === 'running' ? '暂停' : '启用' }}
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="removeAd(row as AdCampaign)">
            删除
          </el-button>
        </div>
      </template>
    </DataTable>

    <el-dialog v-model="dialogState.visible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：秋季器材促销 1 期" maxlength="40" />
        </el-form-item>
        <el-form-item label="广告主" prop="advertiser">
          <el-input v-model="form.advertiser" placeholder="请输入广告主名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="投放位置" prop="placement">
          <el-select v-model="form.placement" style="width: 100%">
            <el-option
              v-for="option in AD_PLACEMENT_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额" prop="budget">
          <el-input-number
            v-model="form.budget"
            :min="1000"
            :max="5_000_000"
            :step="1000"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="投放周期" prop="startAt">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogState.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.cell-plan {
  display: flex;
  flex-direction: column;

  strong {
    color: var(--app-ink);
    font-weight: 500;
  }

  small {
    color: var(--app-ink-3);
    font-size: 12px;
  }
}

.cell-budget {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__text {
    color: var(--app-ink-2);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
}

.cell-performance {
  display: flex;
  flex-direction: column;
  color: var(--app-ink-2);
  font-variant-numeric: tabular-nums;

  small {
    color: var(--app-ink-3);
    font-size: 12px;
  }
}

.cell-period {
  color: var(--app-ink-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
