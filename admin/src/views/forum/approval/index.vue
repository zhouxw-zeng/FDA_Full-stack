<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Check, Close, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import {
  auditForumDynamic,
  fetchForumChangeLogs,
  fetchForumDynamicDetail,
  fetchForumDynamics,
  fetchForumDynamicTypes,
} from '@/api/forum';
import {
  AuditDialog,
  DataTable,
  EmptyState,
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
import { AUDIT_STATUS_OPTIONS, CHANGE_ACTION_LABELS } from '@/constants';
import type {
  ForumChangeLog,
  ForumDynamic,
  ForumDynamicQuery,
  ForumDynamicType,
} from '@/types';
import { formatDateTime } from '@/utils/format';

defineOptions({ name: 'ForumApproval' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  ForumDynamic,
  ForumDynamicQuery
>({
  fetcher: fetchForumDynamics,
  // 默认只看待审队列，可切换审核状态回看历史
  defaults: { keyword: '', typeId: '', auditStatus: 'pending' },
});

const columns: TableColumn[] = [
  { prop: 'content', label: '动态内容', minWidth: 300, slot: 'content' },
  { prop: 'media', label: '素材', width: 150, slot: 'media' },
  { prop: 'author.nickname', label: '发布人', width: 150, slot: 'author' },
  { prop: 'typeName', label: '类型', width: 110 },
  { prop: 'createdAt', label: '提交时间', width: 150, slot: 'createdAt' },
  { prop: 'auditStatus', label: '审核状态', width: 104, slot: 'auditStatus', align: 'center' },
  { prop: 'actions', label: '操作', width: 190, slot: 'actions', fixed: 'right' },
];

const types = ref<ForumDynamicType[]>([]);
const selection = ref<ForumDynamic[]>([]);
const submitting = ref(false);

const auditState = reactive<{
  visible: boolean;
  action: 'approve' | 'reject';
  target: ForumDynamic | null;
}>({ visible: false, action: 'approve', target: null });

const detailState = reactive<{ visible: boolean; target: ForumDynamic | null }>({
  visible: false,
  target: null,
});

const logs = ref<ForumChangeLog[]>([]);
const logsLoading = ref(false);

const previewState = reactive<{ visible: boolean; index: number; target: ForumDynamic | null }>({
  visible: false,
  index: 0,
  target: null,
});

const previewItems = computed(() => previewState.target?.media ?? []);
/** 只有待审的记录可以批量通过 */
const pendingSelection = computed(() =>
  selection.value.filter((item) => item.auditStatus === 'pending'),
);

function openAudit(row: ForumDynamic, action: 'approve' | 'reject'): void {
  auditState.target = row;
  auditState.action = action;
  auditState.visible = true;
}

async function submitAudit(remark: string): Promise<void> {
  if (!auditState.target) {
    return;
  }
  submitting.value = true;
  try {
    await auditForumDynamic({
      id: auditState.target.id,
      status: auditState.action === 'approve' ? 'approved' : 'rejected',
      remark,
    });
    ElMessage.success(auditState.action === 'approve' ? '已通过该动态' : '已驳回该动态');
    auditState.visible = false;
    await reload();
    if (detailState.visible && detailState.target?.id === auditState.target.id) {
      detailState.visible = false;
    }
  } finally {
    submitting.value = false;
  }
}

async function batchApprove(): Promise<void> {
  const targets = pendingSelection.value;
  if (targets.length === 0) {
    ElMessage.warning('请先勾选待审批的动态');
    return;
  }
  const accepted = await confirm(`将批量通过 ${targets.length} 条动态，确定继续吗？`, {
    title: '批量通过',
    confirmText: '全部通过',
  });
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    // 后端没有批量接口，这里并发调用单条审批
    await Promise.all(
      targets.map((item) =>
        auditForumDynamic({ id: item.id, status: 'approved', remark: '批量通过' }),
      ),
    );
    ElMessage.success(`已通过 ${targets.length} 条动态`);
    selection.value = [];
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function openDetail(row: ForumDynamic): Promise<void> {
  detailState.target = row;
  detailState.visible = true;
  logs.value = [];
  logsLoading.value = true;
  try {
    const [detail, logPage] = await Promise.all([
      fetchForumDynamicDetail(row.id),
      fetchForumChangeLogs({ targetId: row.id, page: 1, size: 20 }),
    ]);
    detailState.target = detail;
    logs.value = logPage.list;
  } finally {
    logsLoading.value = false;
  }
}

function openPreview(row: ForumDynamic, index = 0): void {
  if (row.media.length === 0) {
    ElMessage.info('该动态没有可预览的素材');
    return;
  }
  previewState.target = row;
  previewState.index = index;
  previewState.visible = true;
}

onMounted(async () => {
  const result = await fetchForumDynamicTypes();
  types.value = result.list;
});
</script>

<template>
  <div class="forum-approval">
    <PageHeader
      title="论坛信息审批"
      description="审核 C 端提交的论坛动态，通过后才会在社区展示"
    >
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
        placeholder="搜索内容 / 发布人 / 编号"
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
      <el-select v-model="query.typeId" placeholder="动态类型" clearable style="width: 150px">
        <el-option
          v-for="type in types"
          :key="type.typeId"
          :label="type.typeName"
          :value="type.typeId"
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
      empty-text="没有符合条件的待审动态"
      @update:page="changePage"
      @update:page-size="changePageSize"
      @selection-change="selection = $event"
    >
      <template #content="{ row }">
        <div class="cell-content">
          <el-tag v-if="(row as ForumDynamic).pinned" type="warning" size="small" effect="plain">
            置顶
          </el-tag>
          <span class="cell-content__text">{{ (row as ForumDynamic).content }}</span>
          <span class="cell-content__meta">{{ (row as ForumDynamic).id }}</span>
        </div>
      </template>

      <template #media="{ row }">
        <div class="cell-media">
          <button
            v-for="(media, index) in (row as ForumDynamic).media.slice(0, 3)"
            :key="media.id"
            type="button"
            class="cell-media__item"
            :aria-label="`预览第 ${index + 1} 个素材`"
            @click="openPreview(row as ForumDynamic, index)"
          >
            <MediaThumb :media="media" :show-kind="false" />
          </button>
          <span v-if="(row as ForumDynamic).media.length === 0" class="cell-media__empty">
            纯文本
          </span>
          <span v-else-if="(row as ForumDynamic).media.length > 3" class="cell-media__more">
            +{{ (row as ForumDynamic).media.length - 3 }}
          </span>
        </div>
      </template>

      <template #author="{ row }">
        <div class="cell-author">
          <UserAvatar
            :nickname="(row as ForumDynamic).author.nickname"
            :src="(row as ForumDynamic).author.avatar || undefined"
            :size="26"
          />
          <span>{{ (row as ForumDynamic).author.nickname }}</span>
        </div>
      </template>

      <template #createdAt="{ row }">
        <span class="cell-time">{{ formatDateTime((row as ForumDynamic).createdAt) }}</span>
      </template>

      <template #auditStatus="{ row }">
        <StatusTag kind="audit" :value="(row as ForumDynamic).auditStatus" />
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as ForumDynamic)">
            详情
          </el-button>
          <el-button
            link
            type="success"
            :icon="Check"
            :disabled="(row as ForumDynamic).auditStatus === 'approved'"
            @click="openAudit(row as ForumDynamic, 'approve')"
          >
            通过
          </el-button>
          <el-button
            link
            type="danger"
            :icon="Close"
            :disabled="(row as ForumDynamic).auditStatus === 'rejected'"
            @click="openAudit(row as ForumDynamic, 'reject')"
          >
            驳回
          </el-button>
        </div>
      </template>
    </DataTable>

    <AuditDialog
      v-model="auditState.visible"
      :action="auditState.action"
      :subject="auditState.target?.content"
      :loading="submitting"
      @submit="submitAudit"
    />

    <MediaPreviewDialog
      v-model="previewState.visible"
      :items="previewItems"
      :start-index="previewState.index"
    />

    <el-drawer v-model="detailState.visible" title="动态详情" size="520px" destroy-on-close>
      <template v-if="detailState.target">
        <div class="detail">
          <header class="detail__head">
            <UserAvatar
              :nickname="detailState.target.author.nickname"
              :src="detailState.target.author.avatar || undefined"
              :size="36"
            />
            <div>
              <strong>{{ detailState.target.author.nickname }}</strong>
              <small>{{ formatDateTime(detailState.target.createdAt) }}</small>
            </div>
            <el-tag size="small" effect="plain">{{ detailState.target.typeName }}</el-tag>
          </header>

          <p class="detail__content">{{ detailState.target.content }}</p>

          <div v-if="detailState.target.media.length" class="detail__media">
            <MediaThumb
              v-for="(media, index) in detailState.target.media"
              :key="media.id"
              :media="media"
              @click="openPreview(detailState.target as ForumDynamic, index)"
            />
          </div>

          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="动态编号">
              {{ detailState.target.id }}
            </el-descriptions-item>
            <el-descriptions-item label="话题">
              {{ detailState.target.topic }}
            </el-descriptions-item>
            <el-descriptions-item label="点赞">
              {{ detailState.target.likeCount }}
            </el-descriptions-item>
            <el-descriptions-item label="评论">
              {{ detailState.target.commentCount }}
            </el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <StatusTag kind="audit" :value="detailState.target.auditStatus" />
            </el-descriptions-item>
            <el-descriptions-item label="展示状态">
              <StatusTag kind="forumEnabled" :value="detailState.target.enabled" />
            </el-descriptions-item>
          </el-descriptions>

          <section class="detail__block">
            <h4>变更日志</h4>
            <el-skeleton v-if="logsLoading" :rows="2" animated />
            <EmptyState v-else-if="logs.length === 0" description="暂无变更记录" compact />
            <el-timeline v-else>
              <el-timeline-item
                v-for="log in logs"
                :key="log.id"
                :timestamp="formatDateTime(log.changedAt)"
                placement="top"
              >
                <p class="detail__log-title">
                  {{ CHANGE_ACTION_LABELS[log.action] ?? log.action }}
                  <span class="detail__log-actor">
                    {{ log.editorType === 'admin' ? '管理员' : '用户' }} #{{ log.editorId }}
                  </span>
                </p>
                <span v-if="log.remark" class="detail__log-remark">{{ log.remark }}</span>
              </el-timeline-item>
            </el-timeline>
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
          <el-button type="primary" :icon="Check" @click="openAudit(detailState.target, 'approve')">
            通过
          </el-button>
        </template>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.cell-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;

  &__text {
    display: -webkit-box;
    overflow: hidden;
    color: var(--app-ink);
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    color: var(--app-ink-3);
    font-size: 12px;
  }
}

.cell-media {
  display: flex;
  gap: 4px;
  align-items: center;

  &__item {
    width: 44px;
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
  }

  &__more,
  &__empty {
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

  &__head {
    display: flex;
    gap: 10px;
    align-items: center;

    div {
      display: flex;
      flex: 1;
      flex-direction: column;
    }

    strong {
      color: var(--app-ink);
      font-size: 13px;
    }

    small {
      color: var(--app-ink-3);
      font-size: 12px;
    }
  }

  &__content {
    color: var(--app-ink-2);
    line-height: 1.75;
  }

  &__media {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;

    :deep(.media-thumb) {
      cursor: pointer;
    }
  }

  &__block {
    h4 {
      margin-bottom: 8px;
      color: var(--app-ink-3);
      font-size: 12px;
      font-weight: 500;
    }
  }

  &__log-title {
    color: var(--app-ink);
    font-size: 13px;
  }

  &__log-actor {
    margin-left: 6px;
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__log-remark {
    color: var(--app-ink-2);
    font-size: 12px;
  }
}
</style>
