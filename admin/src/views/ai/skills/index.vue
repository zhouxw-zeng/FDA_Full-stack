<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Delete, Download, Edit, Plus, Upload, View } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus';

import {
  createAiSkill,
  deleteAiSkill,
  fetchAiSkillDetail,
  fetchAiSkills,
  updateAiSkill,
} from '@/api/ai';
import { uploadFile } from '@/api/files';
import { DataTable, MarkdownEditor, PageHeader, SearchPanel, type TableColumn } from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import type { AiSkill, AiSkillQuery } from '@/types';
import { formatDateTime } from '@/utils/format';
import {
  SKILL_FILE_NAME,
  buildSkillMarkdown,
  createMarkdownFile,
  downloadMarkdown,
  toSkillDirectory,
  toSkillFileName,
} from '@/utils/skill-template';

defineOptions({ name: 'AiSkills' });

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  AiSkill,
  AiSkillQuery
>({
  fetcher: fetchAiSkills,
  defaults: { keyword: '' },
});

const columns: TableColumn[] = [
  { prop: 'skillName', label: '技能', minWidth: 240, slot: 'skillName' },
  { prop: 'fileName', label: '文件名', width: 160, slot: 'fileName' },
  { prop: 'size', label: '内容规模', width: 150, slot: 'size' },
  { prop: 'updatedAt', label: '更新时间', width: 130, slot: 'updatedAt' },
  { prop: 'actions', label: '操作', width: 220, slot: 'actions', fixed: 'right' },
];

const submitting = ref(false);
const formRef = ref<FormInstance>();

const dialogState = reactive<{ visible: boolean; mode: 'create' | 'edit'; id: string }>({
  visible: false,
  mode: 'create',
  id: '',
});

/** create 模式下二选一：直接上传 md，或填表生成模板 */
const createMode = ref<'upload' | 'template'>('upload');

const form = reactive({ skillName: '', description: '', instruction: '', content: '' });
const selectedFile = ref<File | null>(null);

const detailState = reactive<{ visible: boolean; target: AiSkill | null }>({
  visible: false,
  target: null,
});

const dialogTitle = computed(() =>
  dialogState.mode === 'create' ? '新增技能' : '编辑技能',
);

const isUploadMode = computed(
  () => dialogState.mode === 'create' && createMode.value === 'upload',
);
const isTemplateMode = computed(
  () => dialogState.mode === 'create' && createMode.value === 'template',
);

/** 模板模式下实时预览将要保存的 Markdown */
const generatedMarkdown = computed(() =>
  buildSkillMarkdown({
    skillName: form.skillName || '技能名称',
    description: form.description,
    instruction: form.instruction || '在这里描述这个技能要做什么、按什么规则执行。',
  }),
);

const rules = computed<FormRules>(() => ({
  skillName: [
    { required: true, message: '请输入技能名称', trigger: 'blur' },
    { min: 2, max: 100, message: '技能名称长度为 2-100 个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '技能描述不超过 500 个字符', trigger: 'blur' }],
  instruction: isTemplateMode.value
    ? [{ required: true, message: '请输入技能指令', trigger: 'blur' }]
    : [],
}));

function resetForm(): void {
  form.skillName = '';
  form.description = '';
  form.instruction = '';
  form.content = '';
  selectedFile.value = null;
  createMode.value = 'upload';
}

function openCreate(): void {
  dialogState.mode = 'create';
  dialogState.id = '';
  resetForm();
  dialogState.visible = true;
}

async function openEdit(row: AiSkill): Promise<void> {
  // 先取到文件正文再打开弹窗，避免异步返回把用户已输入的内容覆盖掉
  const detail = await fetchAiSkillDetail(row.id);

  dialogState.mode = 'edit';
  dialogState.id = row.id;
  resetForm();
  form.skillName = detail.skillName;
  form.description = detail.description ?? '';
  form.content = detail.fileContent;
  dialogState.visible = true;
}

/** el-upload 手动模式：只取原生 File，交给提交阶段统一发送 */
function handleFileChange(uploadFile: UploadFile): void {
  const raw = uploadFile.raw;
  if (!raw) {
    return;
  }
  if (!raw.name.toLowerCase().endsWith('.md')) {
    ElMessage.warning('技能文件必须是 .md 文件');
    return;
  }
  if (raw.size > MAX_FILE_SIZE) {
    ElMessage.warning('技能文件请控制在 2MB 以内');
    return;
  }

  selectedFile.value = raw;
  // 上传模式下用文件名自动填充技能名称，允许再改
  if (!form.skillName) {
    form.skillName = raw.name.replace(/\.md$/i, '');
  }
}

function clearFile(): void {
  selectedFile.value = null;
}

async function submitForm(): Promise<void> {
  if (!formRef.value) {
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  let file: File | undefined;
  let overwrite = false;

  if (dialogState.mode === 'edit') {
    // 编辑直接用文本编辑器改内容，提交时以同名文件覆盖原文件
    if (!form.content.trim()) {
      ElMessage.warning('技能内容不能为空');
      return;
    }
    file = createMarkdownFile(SKILL_FILE_NAME, form.content);
    overwrite = true;
  } else if (isUploadMode.value) {
    if (!selectedFile.value) {
      ElMessage.warning('请先选择 .md 技能文件');
      return;
    }
    file = selectedFile.value;
  } else if (isTemplateMode.value) {
    file = createMarkdownFile(toSkillFileName(form.skillName), generatedMarkdown.value);
  }

  submitting.value = true;
  try {
    // 文件统一先经本地文件上传接口落盘，技能记录只保存返回的文件地址
    let fileUrl: string | undefined;
    if (file) {
      const uploaded = await uploadFile(file, {
        // 每个技能一个目录，目录内固定 skills.md：
        // document/<上传日期>/ai/skills/<技能名>/skills.md
        fileName: SKILL_FILE_NAME,
        storageAddress: `ai/skills/${toSkillDirectory(form.skillName)}`,
        overwrite,
      });
      fileUrl = uploaded.url;
    }

    const payload = {
      skillName: form.skillName.trim(),
      description: form.description.trim() || undefined,
      fileUrl,
    };

    if (dialogState.mode === 'create') {
      await createAiSkill(payload);
      ElMessage.success('技能已创建');
    } else {
      await updateAiSkill({ ...payload, id: dialogState.id });
      ElMessage.success('技能已更新');
    }
    dialogState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function openDetail(row: AiSkill): Promise<void> {
  detailState.target = row;
  detailState.visible = true;
  detailState.target = await fetchAiSkillDetail(row.id);
}

/** 优先按本地文件地址下载；历史数据没有地址时回退到内存中的正文 */
function handleDownload(skill: AiSkill): void {
  if (skill.fileUrl) {
    const link = document.createElement('a');
    link.href = skill.fileUrl;
    link.download = skill.fileName;
    link.click();
    return;
  }
  downloadMarkdown(skill.fileName, skill.fileContent);
}

async function removeSkill(row: AiSkill): Promise<void> {
  const accepted = await confirm(`删除后「${row.skillName}」将无法再被模型引用，确定删除吗？`, {
    title: '删除技能',
    confirmText: '删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    await deleteAiSkill(row.id);
    ElMessage.success('技能已删除');
    detailState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

function contentSize(skill: AiSkill): string {
  const lines = skill.fileContent.split('\n').length;
  return `${lines} 行 · ${skill.fileContent.length} 字符`;
}
</script>

<template>
  <div class="ai-skills">
    <PageHeader title="Skills 管理" description="维护可被模型引用的技能文件，内容保存为 Markdown">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增技能</el-button>
      </template>
    </PageHeader>

    <SearchPanel :loading="loading" @search="search" @reset="reset">
      <el-input
        v-model="query.keyword"
        placeholder="搜索技能名称 / 描述"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
    </SearchPanel>

    <DataTable
      :data="list"
      :columns="columns"
      :loading="loading"
      :total="total"
      :page="query.page"
      :page-size="query.size"
      empty-text="还没有技能"
      @update:page="changePage"
      @update:page-size="changePageSize"
    >
      <template #skillName="{ row }">
        <div class="cell-skill">
          <strong>{{ (row as AiSkill).skillName }}</strong>
          <small>{{ (row as AiSkill).description || '暂无描述' }}</small>
        </div>
      </template>

      <template #fileName="{ row }">
        <span class="cell-mono">{{ (row as AiSkill).fileName }}</span>
      </template>

      <template #size="{ row }">
        <span class="cell-mono">{{ contentSize(row as AiSkill) }}</span>
      </template>

      <template #updatedAt="{ row }">
        <span class="cell-time">{{ formatDateTime((row as AiSkill).updatedAt) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as AiSkill)">
            查看
          </el-button>
          <el-button link :icon="Download" @click="handleDownload(row as AiSkill)">
            下载
          </el-button>
          <el-button link type="primary" :icon="Edit" @click="openEdit(row as AiSkill)">
            编辑
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="removeSkill(row as AiSkill)">
            删除
          </el-button>
        </div>
      </template>
    </DataTable>

    <el-dialog v-model="dialogState.visible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item v-if="dialogState.mode === 'create'" label="创建方式">
          <el-radio-group v-model="createMode">
            <el-radio-button value="upload">上传 .md 文件</el-radio-button>
            <el-radio-button value="template">填写内容生成模板</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="isUploadMode" label="技能文件">
          <div class="upload-row">
            <el-upload
              action="#"
              accept=".md,text/markdown"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
            >
              <el-button :icon="Upload">选择 .md 文件</el-button>
            </el-upload>
            <span v-if="selectedFile" class="upload-row__file">
              {{ selectedFile.name }}
              <el-button link type="danger" @click="clearFile">移除</el-button>
            </span>
            <span v-else class="upload-row__hint">
              支持 .md，单文件不超过 2MB；上传后保存返回的文件地址
            </span>
          </div>
        </el-form-item>

        <el-form-item label="技能名称" prop="skillName">
          <el-input v-model="form.skillName" maxlength="100" placeholder="例如：图片短描述" />
        </el-form-item>

        <el-form-item label="技能描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="说明这个技能的适用场景，可留空"
          />
        </el-form-item>

        <template v-if="isTemplateMode">
          <el-form-item label="技能指令" prop="instruction">
            <el-input
              v-model="form.instruction"
              type="textarea"
              :rows="4"
              maxlength="2000"
              show-word-limit
              placeholder="描述技能要做什么、按什么规则执行，例如：根据图片生成 30 字以内的中文描述。"
            />
          </el-form-item>

          <el-form-item label="模板预览">
            <pre class="markdown-preview">{{ generatedMarkdown }}</pre>
          </el-form-item>
        </template>

        <el-form-item v-if="dialogState.mode === 'edit'" label="技能内容">
          <MarkdownEditor
            v-model="form.content"
            :min-height="300"
            placeholder="直接编辑 Markdown 内容，保存时会覆盖原文件"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogState.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailState.visible" title="技能详情" size="560px" destroy-on-close>
      <div v-if="detailState.target" class="skill-detail">
        <header class="skill-detail__head">
          <div>
            <h3>{{ detailState.target.skillName }}</h3>
            <p>{{ detailState.target.description || '暂无描述' }}</p>
          </div>
          <el-tag size="small" effect="plain">{{ detailState.target.fileName }}</el-tag>
        </header>

        <div v-if="detailState.target.fileUrl" class="skill-detail__url">
          <span class="skill-detail__url-label">文件地址</span>
          <el-link
            type="primary"
            :href="detailState.target.fileUrl"
            target="_blank"
            rel="noopener"
          >
            {{ detailState.target.fileUrl }}
          </el-link>
        </div>

        <pre class="markdown-preview markdown-preview--full">{{ detailState.target.fileContent }}</pre>
      </div>

      <template #footer>
        <el-button @click="detailState.visible = false">关闭</el-button>
        <el-button
          v-if="detailState.target"
          :icon="Download"
          @click="handleDownload(detailState.target)"
        >
          下载 .md
        </el-button>
        <el-button
          v-if="detailState.target"
          type="primary"
          :icon="Edit"
          @click="openEdit(detailState.target)"
        >
          编辑
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.cell-skill {
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

.cell-time {
  color: var(--app-ink-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  &__file {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    color: var(--app-ink-2);
    font-size: 12px;
  }

  &__hint {
    color: var(--app-ink-3);
    font-size: 12px;
  }
}

.markdown-preview {
  width: 100%;
  max-height: 220px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  color: var(--app-ink-2);
  font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  background-color: var(--app-surface-2);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);

  &--full {
    max-height: none;
  }
}

.skill-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;

    h3 {
      color: var(--app-ink);
      font-size: 15px;
      font-weight: 600;
    }

    p {
      margin-top: 4px;
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }

  &__url {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 8px 12px;
    font-size: 12px;
    background-color: var(--app-surface-2);
    border-radius: var(--app-radius);

    :deep(.el-link__inner) {
      word-break: break-all;
    }
  }

  &__url-label {
    flex-shrink: 0;
    color: var(--app-ink-3);
  }
}
</style>
