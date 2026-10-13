<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Delete, Picture, Star, VideoPause, VideoPlay, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import {
  deleteForumDynamic,
  fetchForumChangeLogs,
  fetchForumDynamicDetail,
  fetchForumDynamics,
  fetchForumDynamicTypes,
  updateForumDynamicStatus,
} from '@/api/forum';
import {
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
import { AUDIT_STATUS_OPTIONS, CHANGE_ACTION_LABELS, ENABLED_OPTIONS } from '@/constants';
import type {
  ForumChangeLog,
  ForumDynamic,
  ForumDynamicQuery,
  ForumDynamicType,
} from '@/types';
import { formatDateTime, formatRelative } from '@/utils/format';

defineOptions({ name: 'ForumDynamics' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  ForumDynamic,
  ForumDynamicQuery
>({
  fetcher: fetchForumDynamics,
  defaults: { keyword: '', typeId: '', pinned: '', auditStatus: '', enabled: '' },
});

const columns: TableColumn[] = [
  { prop: 'content', label: '动态内容', minWidth: 260, slot: 'content' },
  { prop: 'media', label: '素材', width: 110, slot: 'media' },
  { prop: 'author.nickname', label: '发布人', width: 130, slot: 'author' },
  { prop: 'typeName', label: '类型', width: 100 },
  { prop: 'engagement', label: '互动', width: 110, slot: 'engagement' },
  { prop: 'createdAt', label: '发布时间', width: 120, slot: 'createdAt' },
  // 审核与展示合并成一列，避免状态列被挤到横向滚动区
  { prop: 'status', label: '状态', width: 110, slot: 'status', align: 'center' },
  { prop: 'actions', label: '操作', width: 200, slot: 'actions', fixed: 'right' },
];

const types = ref<ForumDynamicType[]>([]);
const selection = ref<ForumDynamic[]>([]);
const submitting = ref(false);

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

function openPreview(row: ForumDynamic, index = 0): void {
  if (row.media.length === 0) {
    ElMessage.info('该动态没有可预览的素材');
    return;
  }
  previewState.target = row;
  previewState.index = index;
  previewState.visible = true;
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

/** 下架 / 重新上架：后端会校验只有审核通过的动态才能启用 */
async function toggleEnabled(row: ForumDynamic): Promise<void> {
  const next = row.enabled === 1 ? 0 : 1;
  const accepted = await confirm(
    next === 1
      ? `重新上架后「${row.id}」会再次展示在社区，确定继续吗？`
      : `下架后「${row.id}」将不再对用户展示，确定继续吗？`,
    {
      title: next === 1 ? '重新上架' : '下架动态',
      confirmText: next === 1 ? '上架' : '下架',
    },
  );
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    await updateForumDynamicStatus({ id: row.id, enabled: next });
    ElMessage.success(next === 1 ? '已重新上架' : '已下架');
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function removeOne(row: ForumDynamic): Promise<void> {
  const accepted = await confirm(`删除后「${row.id}」无法恢复，确定删除吗？`, {
    title: '删除动态',
    confirmText: '删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }
  submitting.value = true;
  try {
    await deleteForumDynamic(row.id);
    ElMessage.success('动态已删除');
    detailState.visible = false;
    await reload();
  } finally {
    submitting.value = false;
  }
}

async function removeBatch(): Promise<void> {
  if (selection.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的动态');
    return;
  }
  const accepted = await confirm(`将删除 ${selection.value.length} 条动态，该操作不可撤销。`, {
    title: '批量删除',
    confirmText: '全部删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }

  submitting.value = true;
  try {
    await Promise.all(selection.value.map((item) => deleteForumDynamic(item.id)));
    ElMessage.success(`已删除 ${selection.value.length} 条动态`);
    selection.value = [];
    await reload();
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  const result = await fetchForumDynamicTypes();
  types.value = result.list;
});
</script>

<template>
  <div class="forum-dynamics">
    <PageHeader title="论坛动态" description="管理社区动态的展示状态，违规内容可下架或删除">
      <template #actions>
        <el-button
          type="danger"
          plain
          :icon="Delete"
          :disabled="selection.length === 0"
          :loading="submitting"
          @click="removeBatch"
        >
          批量删除（{{ selection.length }}）
        </el-button>
      </template>
    </PageHeader>

    <SearchPanel :loading="loading" @search="search" @reset="reset">
      <el-input
        v-model="query.keyword"
        placeholder="搜索内容 / 发布人 / 编号"
        clearable
        style="width: 220px"
        @keyup.enter="search"
      />
      <el-select v-model="query.typeId" placeholder="动态类型" clearable style="width: 150px">
        <el-option
          v-for="type in types"
          :key="type.typeId"
          :label="type.typeName"
          :value="type.typeId"
        />
      </el-select>
      <el-select v-model="query.auditStatus" placeholder="审核状态" clearable style="width: 130px">
        <el-option
          v-for="option in AUDIT_STATUS_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.enabled" placeholder="展示状态" clearable style="width: 130px">
        <el-option
          v-for="option in ENABLED_OPTIONS"
          :key="option.label"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.pinned" placeholder="是否置顶" clearable style="width: 130px">
        <el-option label="已置顶" :value="true" />
        <el-option label="未置顶" :value="false" />
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
      empty-text="没有符合条件的动态"
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

      <template #engagement="{ row }">
        <div class="cell-engagement">
          <span><el-icon><Star /></el-icon>{{ (row as ForumDynamic).likeCount }}</span>
          <span><el-icon><Picture /></el-icon>{{ (row as ForumDynamic).commentCount }}</span>
        </div>
      </template>

      <template #createdAt="{ row }">
        <el-tooltip :content="formatDateTime((row as ForumDynamic).createdAt)" placement="top">
          <span class="cell-time">{{ formatRelative((row as ForumDynamic).createdAt) }}</span>
        </el-tooltip>
      </template>

      <template #status="{ row }">
        <div class="cell-status">
          <StatusTag kind="audit" :value="(row as ForumDynamic).auditStatus" />
          <StatusTag kind="forumEnabled" :value="(row as ForumDynamic).enabled" />
        </div>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as ForumDynamic)">
            详情
          </el-button>
          <el-button
            link
            :type="(row as ForumDynamic).enabled === 1 ? 'warning' : 'success'"
            :icon="(row as ForumDynamic).enabled === 1 ? VideoPause : VideoPlay"
            :disabled="
              (row as ForumDynamic).enabled === 0 && (row as ForumDynamic).auditStatus !== 'approved'
            "
            @click="toggleEnabled(row as ForumDynamic)"
          >
            {{ (row as ForumDynamic).enabled === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="removeOne(row as ForumDynamic)">
            删除
          </el-button>
        </div>
      </template>
    </DataTable>

    <MediaPreviewDialog
      v-model="previewState.visible"
      :items="previewItems"
      :start-index="previewState.index"
    />

    <el-drawer v-model="detailState.visible" title="动态详情" size="480px" destroy-on-close>
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

          <dl class="detail__stats">
            <div><dt>点赞</dt><dd>{{ detailState.target.likeCount }}</dd></div>
            <div><dt>评论</dt><dd>{{ detailState.target.commentCount }}</dd></div>
            <div><dt>转发</dt><dd>{{ detailState.target.shareCount }}</dd></div>
          </dl>

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
        <el-button
          v-if="detailState.target"
          type="danger"
          :icon="Delete"
          :loading="submitting"
          @click="removeOne(detailState.target)"
        >
          删除动态
        </el-button>
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

.cell-engagement {
  display: flex;
  gap: 12px;
  color: var(--app-ink-2);
  font-variant-numeric: tabular-nums;

  span {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
}

.cell-time {
  color: var(--app-ink-2);
}

.cell-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;

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

  &__stats {
    display: flex;
    gap: 32px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border);

    dt {
      color: var(--app-ink-3);
      font-size: 12px;
    }

    dd {
      margin: 0;
      color: var(--app-ink);
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
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
