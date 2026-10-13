<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Close, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { auditForumPost, fetchForumPosts } from '@/api/forum';
import {
  AuditDialog,
  DataTable,
  MediaPreviewDialog,
  MediaThumb,
  PageHeader,
  SearchPanel,
  StatusTag,
  UserAvatar,
  type TableColumn,
} from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { AUDIT_STATUS_OPTIONS, FORUM_CATEGORY_OPTIONS } from '@/constants';
import type { ForumPost, ForumPostQuery } from '@/types';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'ForumApproval' });

const { confirm } = useConfirm();

const {
  list,
  total,
  loading,
  query,
  search,
  reset,
  reload,
  changePage,
  changePageSize,
} = useTable<ForumPost, ForumPostQuery>({
  fetcher: fetchForumPosts,
  defaults: { keyword: '', status: '', category: '' },
});

const columns: TableColumn[] = [
  { prop: 'cover', label: '封面', width: 100, slot: 'cover' },
  { prop: 'title', label: '论坛信息', minWidth: 260, slot: 'title' },
  { prop: 'category', label: '分类', width: 110 },
  { prop: 'author.nickname', label: '提交人', width: 150, slot: 'author' },
  { prop: 'mediaCount', label: '素材', width: 80, align: 'center' },
  { prop: 'submitAt', label: '提交时间', width: 150, slot: 'submitAt' },
  { prop: 'status', label: '状态', width: 104, slot: 'status', align: 'center' },
  { prop: 'actions', label: '操作', width: 200, slot: 'actions', fixed: 'right' },
];

const selection = ref<ForumPost[]>([]);
const submitting = ref(false);

const auditState = reactive<{
  visible: boolean;
  action: 'approve' | 'reject';
  target: ForumPost | null;
}>({
  visible: false,
  action: 'approve',
  target: null,
});

const detailState = reactive<{
  visible: boolean;
  target: ForumPost | null;
}>({
  visible: false,
  target: null,
});

const previewState = reactive<{
  visible: boolean;
  index: number;
}>({
  visible: false,
  index: 0,
});

const previewItems = computed(() => (detailState.target ? [detailState.target.cover] : []));
const pendingSelection = computed(() => selection.value.filter((item) => item.status === 'pending'));

function openAudit(row: ForumPost, action: 'approve' | 'reject'): void {
  auditState.target = row;
  auditState.action = action;
  auditState.visible = true;
}

function openDetail(row: ForumPost): void {
  detailState.target = row;
  detailState.visible = true;
}

function openPreview(row: ForumPost): void {
  detailState.target = row;
  previewState.visible = true;
}

async function submitAudit(remark: string): Promise<void> {
  if (!auditState.target) {
    return;
  }
  submitting.value = true;
  try {
    await auditForumPost(auditState.target.id, {
      status: auditState.action === 'approve' ? 'approved' : 'rejected',
      remark,
    });
    ElMessage.success(auditState.action === 'approve' ? '已通过该论坛信息' : '已驳回该论坛信息');
    auditState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function batchApprove(): Promise<void> {
  const targets = pendingSelection.value;
  if (targets.length === 0) {
    ElMessage.warning('请先勾选待审批的论坛信息');
    return;
  }
  const accepted = await confirm(`将批量通过 ${targets.length} 条论坛信息，确定继续吗？`, {
    title: '批量通过',
    confirmText: '全部通过',
  });
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    await Promise.all(
      targets.map((item) => auditForumPost(item.id, { status: 'approved', remark: '批量通过' })),
    );
    ElMessage.success(`已通过 ${targets.length} 条论坛信息`);
    selection.value = [];
    await reload();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="forum-approval">
    <PageHeader title="论坛信息审批" description="审核用户提交的板块与帖子主体，确认分类与内容合规">
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
        placeholder="搜索标题 / 提交人 / 编号"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-select v-model="query.status" placeholder="审批状态" clearable style="width: 140px">
        <el-option
          v-for="option in AUDIT_STATUS_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.category" placeholder="所属分类" clearable style="width: 140px">
        <el-option
          v-for="option in FORUM_CATEGORY_OPTIONS"
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
      empty-text="没有符合条件的论坛信息"
      @update:page="changePage"
      @update:page-size="changePageSize"
      @selection-change="selection = $event"
    >
      <template #cover="{ row }">
        <button
          type="button"
          class="cover-button"
          :aria-label="`预览 ${row.title}`"
          @click="openPreview(row as ForumPost)"
        >
          <MediaThumb :media="(row as ForumPost).cover" />
        </button>
      </template>

      <template #title="{ row }">
        <div class="cell-title">
          <strong>{{ (row as ForumPost).title }}</strong>
          <span class="cell-title__meta">{{ (row as ForumPost).id }}</span>
        </div>
      </template>

      <template #author="{ row }">
        <div class="cell-author">
          <UserAvatar :nickname="(row as ForumPost).author.nickname" :size="26" />
          <span>{{ (row as ForumPost).author.nickname }}</span>
        </div>
      </template>

      <template #submitAt="{ row }">
        <span class="cell-time">{{ formatDateTime((row as ForumPost).submitAt) }}</span>
      </template>

      <template #status="{ row }">
        <StatusTag kind="audit" :value="(row as ForumPost).status" />
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as ForumPost)">
            详情
          </el-button>
          <el-button
            link
            type="success"
            :icon="Check"
            :disabled="(row as ForumPost).status === 'approved'"
            @click="openAudit(row as ForumPost, 'approve')"
          >
            通过
          </el-button>
          <el-button
            link
            type="danger"
            :icon="Close"
            :disabled="(row as ForumPost).status === 'rejected'"
            @click="openAudit(row as ForumPost, 'reject')"
          >
            驳回
          </el-button>
        </div>
      </template>
    </DataTable>

    <AuditDialog
      v-model="auditState.visible"
      :action="auditState.action"
      :subject="auditState.target?.title"
      :loading="submitting"
      @submit="submitAudit"
    />

    <MediaPreviewDialog v-model="previewState.visible" :items="previewItems" :start-index="0" />

    <el-drawer v-model="detailState.visible" title="论坛信息详情" size="520px" destroy-on-close>
      <template v-if="detailState.target">
        <div class="detail">
          <MediaThumb :media="detailState.target.cover" />

          <h3 class="detail__title">{{ detailState.target.title }}</h3>

          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="编号">{{ detailState.target.id }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ detailState.target.category }}</el-descriptions-item>
            <el-descriptions-item label="提交人">
              {{ detailState.target.author.nickname }}
            </el-descriptions-item>
            <el-descriptions-item label="素材数量">
              {{ detailState.target.mediaCount }}
            </el-descriptions-item>
            <el-descriptions-item label="浏览">
              {{ detailState.target.viewCount.toLocaleString('zh-CN') }}
            </el-descriptions-item>
            <el-descriptions-item label="评论">
              {{ detailState.target.commentCount.toLocaleString('zh-CN') }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatDateTime(detailState.target.submitAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="审批状态">
              <StatusTag kind="audit" :value="detailState.target.status" />
            </el-descriptions-item>
          </el-descriptions>

          <section class="detail__block">
            <h4>内容简介</h4>
            <p>{{ detailState.target.summary }}</p>
          </section>

          <section class="detail__block">
            <h4>标签</h4>
            <div class="detail__tags">
              <el-tag
                v-for="tag in detailState.target.tags"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </section>

          <section v-if="detailState.target.auditRemark" class="detail__block">
            <h4>审批意见</h4>
            <p class="detail__remark">{{ detailState.target.auditRemark }}</p>
          </section>
        </div>
      </template>

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
          <el-button
            type="primary"
            :icon="Check"
            @click="openAudit(detailState.target, 'approve')"
          >
            通过
          </el-button>
        </template>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.cover-button {
  width: 64px;
  padding: 0;
  cursor: pointer;
  background: none;
  border: none;
}

.cell-title {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: var(--app-ink);
    font-weight: 500;
  }

  &__meta {
    color: var(--app-ink-3);
    font-size: 12px;
  }
}

.cell-author {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cell-time {
  color: var(--app-ink-2);
  font-variant-numeric: tabular-nums;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    color: var(--app-ink);
    font-size: 16px;
    font-weight: 600;
  }

  &__block {
    h4 {
      margin-bottom: 6px;
      color: var(--app-ink-3);
      font-size: 12px;
      font-weight: 500;
    }

    p {
      color: var(--app-ink-2);
      line-height: 1.7;
    }
  }

  &__remark {
    padding: 8px 12px;
    background-color: var(--app-surface-2);
    border-left: 2px solid var(--app-warning);
    border-radius: var(--app-radius-sm);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
