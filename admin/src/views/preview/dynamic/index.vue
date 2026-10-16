<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ChatDotRound, Collection, Refresh, Share, Star } from '@element-plus/icons-vue';

import { fetchForumDynamicTypes, fetchForumDynamics } from '@/api/forum';
import { MediaPreviewDialog, MediaThumb, PageHeader, StatusTag, UserAvatar } from '@/components';
import type { ForumDynamic, ForumDynamicType } from '@/types';
import { formatCompactNumber, formatRelative } from '@/utils/format';

defineOptions({ name: 'PreviewDynamic' });

const loading = ref(true);
const dynamics = ref<ForumDynamic[]>([]);
const types = ref<ForumDynamicType[]>([]);
const activeId = ref('');
const typeId = ref<number | ''>('');

const previewState = ref<{ visible: boolean; index: number }>({ visible: false, index: 0 });

const active = computed(() => dynamics.value.find((item) => item.id === activeId.value) ?? null);

const previewItems = computed(() => active.value?.media ?? []);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await fetchForumDynamics({
      page: 1,
      size: 12,
      typeId: typeId.value,
      keyword: '',
      pinned: '',
    });
    dynamics.value = result.list;
    if (!result.list.some((item) => item.id === activeId.value)) {
      activeId.value = result.list[0]?.id ?? '';
    }
  } finally {
    loading.value = false;
  }
}

function openPreview(index: number): void {
  previewState.value.index = index;
  previewState.value.visible = true;
}

onMounted(async () => {
  const typePage = await fetchForumDynamicTypes();
  types.value = typePage.list;
  await load();
});
</script>

<template>
  <div class="preview">
    <PageHeader title="动态预览" description="按 C 端展示效果核对动态内容与素材排布">
      <template #actions>
        <el-select v-model="typeId" placeholder="全部类型" clearable style="width: 150px" @change="load">
          <el-option
            v-for="type in types"
            :key="type.typeId"
            :label="type.typeName"
            :value="type.typeId"
          />
        </el-select>
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </template>
    </PageHeader>

    <div class="preview__layout">
      <section v-loading="loading" class="preview__list">
        <button
          v-for="item in dynamics"
          :key="item.id"
          type="button"
          class="preview__item"
          :class="{ 'is-active': item.id === activeId }"
          @click="activeId = item.id"
        >
          <UserAvatar :nickname="item.author.nickname" :size="28" />
          <span class="preview__item-body">
            <strong>{{ item.author.nickname }}</strong>
            <span class="preview__item-text">{{ item.content }}</span>
            <span class="preview__item-meta">
              {{ item.topic }} · {{ formatRelative(item.createdAt) }}
            </span>
          </span>
          <el-tag v-if="item.pinned" size="small" type="warning" effect="plain">置顶</el-tag>
        </button>

        <p v-if="!loading && dynamics.length === 0" class="preview__empty">该话题下暂无动态</p>
      </section>

      <section class="preview__stage">
        <div class="phone">
          <header class="phone__bar">
            <span>9:41</span>
            <span class="phone__bar-dots">●●●</span>
          </header>

          <div class="phone__screen">
            <template v-if="active">
              <div class="phone__topic">
                <span># {{ active.topic }}</span>
                <span class="phone__flags">
                  <StatusTag kind="audit" :value="active.auditStatus" />
                  <StatusTag kind="forumEnabled" :value="active.enabled" />
                </span>
              </div>

              <article class="phone__post">
                <header class="phone__author">
                  <UserAvatar :nickname="active.author.nickname" :size="32" />
                  <div class="phone__author-text">
                    <strong>{{ active.author.nickname }}</strong>
                    <small>{{ formatRelative(active.createdAt) }}</small>
                  </div>
                </header>

                <p class="phone__content">{{ active.content }}</p>

                <div
                  v-if="active.media.length"
                  class="phone__media"
                  :class="`phone__media--${Math.min(active.media.length, 4)}`"
                >
                  <button
                    v-for="(media, index) in active.media.slice(0, 4)"
                    :key="media.id"
                    type="button"
                    class="phone__media-item"
                    @click="openPreview(index)"
                  >
                    <MediaThumb :media="media" variant="fill" :show-kind="false" />
                    <span v-if="index === 3 && active.media.length > 4" class="phone__media-more">
                      +{{ active.media.length - 4 }}
                    </span>
                  </button>
                </div>

                <footer class="phone__actions">
                  <span><el-icon><Star /></el-icon>{{ formatCompactNumber(active.likeCount) }}</span>
                  <span>
                    <el-icon><ChatDotRound /></el-icon>{{ formatCompactNumber(active.commentCount) }}
                  </span>
                  <span>
                    <el-icon><Collection /></el-icon>{{ formatCompactNumber(active.favoriteCount) }}
                  </span>
                  <span><el-icon><Share /></el-icon>{{ formatCompactNumber(active.shareCount) }}</span>
                </footer>
              </article>
            </template>

            <p v-else class="preview__empty">请选择左侧的一条动态</p>
          </div>
        </div>

        <dl v-if="active" class="preview__meta">
          <div>
            <dt>动态编号</dt>
            <dd>{{ active.id }}</dd>
          </div>
          <div>
            <dt>素材数量</dt>
            <dd>{{ active.media.length }}</dd>
          </div>
          <div>
            <dt>是否置顶</dt>
            <dd>{{ active.pinned ? '是' : '否' }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <MediaPreviewDialog
      v-model="previewState.visible"
      :items="previewItems"
      :start-index="previewState.index"
    />
  </div>
</template>

<style scoped lang="scss">
.preview {
  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
    gap: 16px;
    align-items: start;

    @media (max-width: 1080px) {
      grid-template-columns: 1fr;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 620px;
    padding: 12px;
    overflow-y: auto;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
  }

  &__item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background-color: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);

    &:hover {
      border-color: var(--app-primary);
    }

    &.is-active {
      background-color: var(--app-primary-weak);
      border-color: var(--app-primary);
    }
  }

  &__item-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    strong {
      color: var(--app-ink);
      font-size: 13px;
      font-weight: 600;
    }
  }

  &__item-text {
    display: -webkit-box;
    overflow: hidden;
    color: var(--app-ink-2);
    font-size: 12px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__item-meta {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__stage {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  &__meta {
    display: flex;
    gap: 28px;
    width: 100%;
    padding: 12px 16px;
    background-color: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);

    dt {
      color: var(--app-ink-3);
      font-size: 12px;
    }

    dd {
      margin: 0;
      color: var(--app-ink);
      font-size: 14px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  &__empty {
    padding: 24px 0;
    color: var(--app-ink-3);
    text-align: center;
  }
}

.phone {
  width: 360px;
  max-width: 100%;
  overflow: hidden;
  background-color: #0f1514;
  border: 8px solid #0f1514;
  border-radius: 28px;
  box-shadow: var(--app-shadow-md);

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    color: #fff;
    font-size: 11px;
  }

  &__bar-dots {
    letter-spacing: 1px;
  }

  &__screen {
    min-height: 520px;
    padding: 12px;
    background-color: var(--app-canvas);
    border-radius: 20px;
  }

  &__topic {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;

    span:first-child {
      color: var(--app-primary);
      font-size: 12px;
      font-weight: 600;
    }
  }

  &__flags {
    display: inline-flex;
    gap: 4px;
    margin-left: auto;
  }

  &__post {
    padding: 12px;
    background-color: var(--app-surface);
    border-radius: var(--app-radius);
  }

  &__author {
    display: flex;
    gap: 8px;
    align-items: center;

    &-text {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--app-ink);
        font-size: 13px;
      }

      small {
        color: var(--app-ink-3);
        font-size: 11px;
      }
    }
  }

  &__content {
    margin-top: 10px;
    color: var(--app-ink-2);
    font-size: 13px;
    line-height: 1.7;
  }

  &__media {
    display: grid;
    gap: 4px;
    margin-top: 10px;

    &--1 {
      grid-template-columns: 1fr;
    }

    &--2,
    &--3,
    &--4 {
      grid-template-columns: repeat(2, 1fr);
    }

    &-more {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 16px;
      background-color: rgba(10, 16, 15, 0.5);
    }
  }

  &__media-item {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    cursor: pointer;
    border: none;
    border-radius: var(--app-radius-sm);
  }

  &__media--1 &__media-item {
    aspect-ratio: 4 / 3;
  }

  &__actions {
    display: flex;
    gap: 20px;
    padding-top: 10px;
    margin-top: 12px;
    color: var(--app-ink-3);
    font-size: 12px;
    border-top: 1px solid var(--app-border);

    span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
  }

  @media (max-width: 480px) {
    width: 100%;
  }
}
</style>
