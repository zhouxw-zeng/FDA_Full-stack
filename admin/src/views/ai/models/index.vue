<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

import {
  createAiModel,
  deleteAiModel,
  fetchAiModelDetail,
  fetchAiModels,
  fetchAiSkills,
  updateAiModel,
} from '@/api/ai';
import { DataTable, PageHeader, SearchPanel, StatusTag, type TableColumn } from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { MODEL_STATUS_OPTIONS } from '@/constants';
import type { AiModelConfig, AiModelPayload, AiModelQuery, AiSkill } from '@/types';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'AiModels' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  AiModelConfig,
  AiModelQuery
>({
  fetcher: fetchAiModels,
  defaults: { keyword: '', providerCode: '', status: '' },
});

const columns: TableColumn[] = [
  { prop: 'displayName', label: '模型', minWidth: 170, slot: 'displayName' },
  { prop: 'providerCode', label: '接入编码', width: 100, slot: 'providerCode' },
  { prop: 'baseUrl', label: '接口地址', width: 150, slot: 'baseUrl' },
  { prop: 'modelName', label: '模型名', width: 110, slot: 'modelName' },
  { prop: 'params', label: '生成参数', width: 110, slot: 'params' },
  { prop: 'skills', label: '技能', width: 90, slot: 'skills', align: 'center' },
  { prop: 'status', label: '状态', width: 96, slot: 'status', align: 'center' },
  { prop: 'updatedAt', label: '更新时间', width: 130, slot: 'updatedAt' },
  { prop: 'actions', label: '操作', width: 140, slot: 'actions', fixed: 'right' },
];

const skills = ref<AiSkill[]>([]);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const dialogState = reactive<{ visible: boolean; mode: 'create' | 'edit'; id: string }>({
  visible: false,
  mode: 'create',
  id: '',
});

const form = reactive<AiModelPayload>({
  providerCode: '',
  providerName: '',
  baseUrl: '',
  apiKey: '',
  modelName: '',
  displayName: '',
  status: 0,
  isDefault: 0,
  maxTokens: 2048,
  temperature: 0.7,
  timeoutMs: 60000,
  systemPrompt: '',
  skillIds: [],
});

const rules: FormRules<AiModelPayload> = {
  providerCode: [
    { required: true, message: '请输入接入编码', trigger: 'blur' },
    {
      pattern: /^[A-Z0-9_-]+$/,
      message: '只能包含大写字母、数字、下划线和短横线',
      trigger: 'blur',
    },
  ],
  providerName: [
    { required: true, message: '请输入服务商名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度为 2-100 个字符', trigger: 'blur' },
  ],
  baseUrl: [
    { required: true, message: '请输入接口地址', trigger: 'blur' },
    { type: 'url', message: '请输入完整的 http(s) 地址', trigger: 'blur' },
  ],
  modelName: [{ required: true, message: '请输入模型名', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入展示名称', trigger: 'blur' }],
};

const dialogTitle = computed(() =>
  dialogState.mode === 'create' ? '新建模型配置' : '编辑模型配置',
);

const apiKeyPlaceholder = computed(() => {
  if (dialogState.mode === 'create') {
    return '请输入服务商提供的 API Key';
  }
  return form.apiKey ? '已加载当前 Key，可直接修改' : '当前未配置 Key，可在此填写';
});

function resetForm(): void {
  form.providerCode = '';
  form.providerName = '';
  form.baseUrl = '';
  form.apiKey = '';
  form.modelName = '';
  form.displayName = '';
  form.status = 0;
  form.isDefault = 0;
  form.maxTokens = 2048;
  form.temperature = 0.7;
  form.timeoutMs = 60000;
  form.systemPrompt = '';
  form.skillIds = [];
}

function openCreate(): void {
  dialogState.mode = 'create';
  dialogState.id = '';
  resetForm();
  dialogState.visible = true;
}

async function openEdit(row: AiModelConfig): Promise<void> {
  dialogState.mode = 'edit';
  dialogState.id = row.id;
  resetForm();
  dialogState.visible = true;

  const detail = await fetchAiModelDetail(row.id);
  form.providerCode = detail.providerCode;
  form.providerName = detail.providerName;
  form.baseUrl = detail.baseUrl;
  form.apiKey = detail.apiKey ?? '';
  form.modelName = detail.modelName;
  form.displayName = detail.displayName;
  form.status = detail.status;
  form.isDefault = detail.isDefault;
  form.maxTokens = detail.maxTokens;
  form.temperature = detail.temperature;
  form.timeoutMs = detail.timeoutMs;
  form.systemPrompt = detail.systemPrompt ?? '';
  form.skillIds = [...detail.skillIds];
}

async function submitForm(): Promise<void> {
  if (!formRef.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  // 后端不回传 apiKey；留空表示保留已保存的 Key
  const payload: AiModelPayload = { ...form };
  if (!payload.apiKey) {
    delete payload.apiKey;
  }

  submitting.value = true;
  try {
    if (dialogState.mode === 'create') {
      await createAiModel(payload);
      ElMessage.success('模型配置已创建');
    } else {
      await updateAiModel({ ...payload, id: dialogState.id });
      ElMessage.success('模型配置已更新');
    }
    dialogState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function removeModel(row: AiModelConfig): Promise<void> {
  const accepted = await confirm(`删除后「${row.displayName}」将无法再被调用，确定删除吗？`, {
    title: '删除模型配置',
    confirmText: '删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    await deleteAiModel(row.id);
    ElMessage.success('模型配置已删除');
    await reload();
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  // 技能列表用于模型表单里的「关联技能」多选
  const result = await fetchAiSkills({ page: 1, size: 100 });
  skills.value = result.list;
});
</script>

<template>
  <div class="ai-models">
    <PageHeader title="AI 模型管理" description="维护可调用的大模型接入信息与生成参数">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建模型配置</el-button>
      </template>
    </PageHeader>

    <SearchPanel :loading="loading" @search="search" @reset="reset">
      <el-input
        v-model="query.keyword"
        placeholder="搜索展示名 / 服务商 / 模型名"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-input
        v-model="query.providerCode"
        placeholder="接入编码"
        clearable
        style="width: 150px"
        @keyup.enter="search"
      />
      <el-select v-model="query.status" placeholder="启用状态" clearable style="width: 130px">
        <el-option
          v-for="option in MODEL_STATUS_OPTIONS"
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
      empty-text="还没有模型配置"
      @update:page="changePage"
      @update:page-size="changePageSize"
    >
      <template #displayName="{ row }">
        <div class="cell-model">
          <strong>{{ (row as AiModelConfig).displayName }}</strong>
          <small>{{ (row as AiModelConfig).providerName }}</small>
        </div>
      </template>

      <template #providerCode="{ row }">
        <el-tag size="small" effect="plain" type="info">
          {{ (row as AiModelConfig).providerCode }}
        </el-tag>
      </template>

      <template #baseUrl="{ row }">
        <el-tooltip :content="(row as AiModelConfig).baseUrl" placement="top">
          <span class="cell-ellipsis">{{ (row as AiModelConfig).baseUrl }}</span>
        </el-tooltip>
      </template>

      <template #modelName="{ row }">
        <span class="cell-mono">{{ (row as AiModelConfig).modelName }}</span>
      </template>

      <template #params="{ row }">
        <span class="cell-mono">
          {{ (row as AiModelConfig).maxTokens }} · T{{ (row as AiModelConfig).temperature }}
        </span>
      </template>

      <template #skills="{ row }">
        <span class="cell-mono">{{ (row as AiModelConfig).skills?.length ?? 0 }}</span>
      </template>

      <template #status="{ row }">
        <div class="cell-status">
          <StatusTag kind="modelStatus" :value="(row as AiModelConfig).status" />
          <el-tag v-if="(row as AiModelConfig).isDefault === 1" size="small" type="warning" effect="plain">
            默认
          </el-tag>
        </div>
      </template>

      <template #updatedAt="{ row }">
        <span class="cell-time">{{ formatDateTime((row as AiModelConfig).updatedAt) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="Edit" @click="openEdit(row as AiModelConfig)">
            编辑
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="removeModel(row as AiModelConfig)">
            删除
          </el-button>
        </div>
      </template>
    </DataTable>

    <el-dialog v-model="dialogState.visible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-divider content-position="left">接入信息</el-divider>

        <div class="form-grid">
          <el-form-item label="接入编码" prop="providerCode">
            <el-input v-model="form.providerCode" placeholder="例如 DEEPSEEK" maxlength="50" />
          </el-form-item>
          <el-form-item label="服务商名称" prop="providerName">
            <el-input v-model="form.providerName" placeholder="例如 DeepSeek" maxlength="100" />
          </el-form-item>
        </div>

        <el-form-item label="接口地址" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="https://api.deepseek.com/v1" maxlength="500" />
        </el-form-item>

        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            clearable
            :placeholder="apiKeyPlaceholder"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="模型名" prop="modelName">
            <el-input v-model="form.modelName" placeholder="deepseek-chat" maxlength="100" />
          </el-form-item>
          <el-form-item label="展示名称" prop="displayName">
            <el-input v-model="form.displayName" placeholder="DeepSeek Chat" maxlength="100" />
          </el-form-item>
        </div>

        <el-divider content-position="left">生成参数</el-divider>

        <div class="form-grid form-grid--three">
          <el-form-item label="最大 Tokens" prop="maxTokens">
            <el-input-number v-model="form.maxTokens" :min="1" :max="200000" :step="256" controls-position="right" />
          </el-form-item>
          <el-form-item label="温度" prop="temperature">
            <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="超时(ms)" prop="timeoutMs">
            <el-input-number v-model="form.timeoutMs" :min="1000" :max="600000" :step="1000" controls-position="right" />
          </el-form-item>
        </div>

        <el-divider content-position="left">能力与状态</el-divider>

        <el-form-item label="关联技能" prop="skillIds">
          <el-select
            v-model="form.skillIds"
            multiple
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择该模型可用的 Skill"
            style="width: 100%"
          >
            <el-option
              v-for="skill in skills"
              :key="skill.id"
              :label="skill.skillName"
              :value="Number(skill.id)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="System Prompt" prop="systemPrompt">
          <el-input
            v-model="form.systemPrompt"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="模型默认的系统提示词，可留空"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="启用状态">
            <el-switch
              :model-value="form.status === 0"
              active-text="启用"
              inactive-text="禁用"
              @update:model-value="form.status = $event ? 0 : 1"
            />
          </el-form-item>
          <el-form-item label="设为默认">
            <el-switch
              :model-value="form.isDefault === 1"
              @update:model-value="form.isDefault = $event ? 1 : 0"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogState.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.cell-model {
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

.cell-mono {
  color: var(--app-ink-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.cell-ellipsis {
  display: block;
  overflow: hidden;
  color: var(--app-ink-2);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.cell-time {
  color: var(--app-ink-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;

  &--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}
</style>
