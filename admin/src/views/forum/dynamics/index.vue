<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Delete, Picture, Star, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import { deleteForumDynamic, fetchForumDynamics } from '@/api/forum';
import {
  DataTable,
  MediaPreviewDialog,
  MediaThumb,
  PageHeader,
  SearchPanel,
  UserAvatar,
  type TableColumn,
} from '@/components';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { TOPIC_OPTIONS } from '@/constants';
import type { ForumDynamic, ForumDynamicQuery } from '@/types';
import { formatDateTime, formatRelative } from '@/utils/format';

defineOptions({ name: 'ForumDynamics' });

const { confirm } = useConfirm();

const { list, total, loading, query, search, reset, reload, changePage, changePageSize } = useTable<
  ForumDynamic,
  ForumDynamicQuery
>({
  fetcher: fetchForumDynamics,
  defaults: { keyword: '', topic: '', pinned: '' },
});

const columns: TableColumn[] = [
  { prop: 'content', label: '动态内容', minWidth: 280, slot: 'content' },
  { prop: 'media', label: '素材', width: 168, slot: 'media' },
  { prop: 'author.nickname', label: '发布人', width: 150, slot: 'author' },
  { prop: 'topic', label: '话题', width: 120 },
  { prop: 'engagement', label: '互动', width: 150, slot: 'engagement' },
  { prop: 'createdAt', label: '发布时间', width: 150, slot: 'createdAt' },
  { prop: 'actions', label: '操作', width: 170, slot: 'actions', fixed: 'right' },
];

const selection = ref<ForumDynamic[]>([]);
const removing = ref(false);

const previewState = reactive<{ visible: boolean; target: ForumDynamic | null; index: number }>({
  visible: false,
  target: null,
  index: 0,
});

const detailState = reactive<{ visible: boolean; target: ForumDynamic | null }>({
  visible: false,
  target: null,
});

const previewItems = computed(() => previewState.target?.media ?? []);

async function removeOne(row: ForumDynamic): Promise<void> {
  const accepted = await confirm(`删除后该动态将从 C 端下线，确定删除「${row.id}」吗？`, {
    title: '删除动态',
    confirmText: '删除',
    danger: true,
  });
  if (!accepted) {
    return;
  }
  removing.value = true;
  try {
    await deleteForumDynamic(row.id);
    ElMessage.success('动态已删除');
    await reload();
  } finally {
    removing.value = false;
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
  removing.value = true;
  try {
    await Promise.all(selection.value.map((item) => deleteForumDynamic(item.id)));
    ElMessage.success(`已删除 ${selection.value.length} 条动态`);
    selection.value = [];
    await reload();
  } finally {
    removing.value = false;
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

function openDetail(row: ForumDynamic): void {
  detailState.target = row;
  detailState.visible = true;
}
</script>

<template>
  <div class="forum-dynamics">
    <PageHeader title="论坛动态" description="查看已发布的社区动态，违规内容可直接下架">
      <template #actions>
        <el-button
          type="danger"
          plain
          :icon="Delete"
          :disabled="selection.length === 0"
          :loading="removing"
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
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-select v-model="query.topic" placeholder="话题" clearable style="width: 150px">
        <el-option
          v-for="option in TOPIC_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-select v-model="query.pinned" placeholder="置顶状态" clearable style="width: 130px">
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
      :page-size="query.pageSize"
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
          <span v-if="(row as ForumDynamic).media.length === 0" class="cell-media__empty">无素材</span>
          <span v-else-if="(row as ForumDynamic).media.length > 3" class="cell-media__more">
            +{{ (row as ForumDynamic).media.length - 3 }}
          </span>
        </div>
      </template>

      <template #author="{ row }">
        <div class="cell-author">
          <UserAvatar :nickname="(row as ForumDynamic).author.nickname" :size="26" />
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

      <template #actions="{ row }">
        <div class="table-actions">
          <el-button link type="primary" :icon="View" @click="openDetail(row as ForumDynamic)">
            详情
          </el-button>
          <el-button
            link
            type="primary"
            :icon="Picture"
            @click="openPreview(row as ForumDynamic, 0)"
          >
            素材
          </el-button>
          <el-button
            link
            type="danger"
            :icon="Delete"
            :loading="removing"
            @click="removeOne(row as ForumDynamic)"
          >
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

    <el-drawer v-model="detailState.visible" title="动态详情" size="460px" destroy-on-close>
      <article v-if="detailState.target" class="dynamic-detail">
        <header class="dynamic-detail__head">
          <UserAvatar :nickname="detailState.target.author.nickname" :size="36" />
          <div>
            <strong>{{ detailState.target.author.nickname }}</strong>
            <small>{{ formatDateTime(detailState.target.createdAt) }}</small>
          </div>
          <el-tag size="small" effect="plain">{{ detailState.target.topic }}</el-tag>
        </header>

        <p class="dynamic-detail__content">{{ detailState.target.content }}</p>

        <div v-if="detailState.target.media.length" class="dynamic-detail__media">
          <MediaThumb
            v-for="(media, index) in detailState.target.media"
            :key="media.id"
            :media="media"
            @click="openPreview(detailState.target as ForumDynamic, index)"
          />
        </div>

        <dl class="dynamic-detail__stats">
          <div>
            <dt>点赞</dt>
            <dd>{{ detailState.target.likeCount }}</dd>
          </div>
          <div>
            <dt>评论</dt>
            <dd>{{ detailState.target.commentCount }}</dd>
          </div>
          <div>
            <dt>转发</dt>
            <dd>{{ detailState.target.shareCount }}</dd>
          </div>
        </dl>
      </article>

      <template #footer>
        <el-button @click="detailState.visible = false">关闭</el-button>
        <el-button
          v-if="detailState.target"
          type="danger"
          :icon="Delete"
          :loading="removing"
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

.dynamic-detail {
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
}
</style>
