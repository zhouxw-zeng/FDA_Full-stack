<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';

import type { MediaItem } from '@/types';
import { formatDuration, formatFileSize } from '@/utils/format';

import MediaThumb from './MediaThumb.vue';

defineOptions({ name: 'MediaPreviewDialog' });

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    items: MediaItem[];
    startIndex?: number;
  }>(),
  {
    startIndex: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [visible: boolean];
}>();

const currentIndex = ref(0);

const current = computed<MediaItem | undefined>(() => props.items[currentIndex.value]);

function step(offset: number): void {
  if (props.items.length === 0) {
    return;
  }
  const next = (currentIndex.value + offset + props.items.length) % props.items.length;
  currentIndex.value = next;
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.modelValue) {
    return;
  }
  if (event.key === 'ArrowLeft') {
    step(-1);
  }
  if (event.key === 'ArrowRight') {
    step(1);
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      currentIndex.value = Math.min(props.startIndex, Math.max(props.items.length - 1, 0));
    }
  },
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    width="860px"
    top="6vh"
    append-to-body
    destroy-on-close
    class="media-preview"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="media-preview__head">
        <span class="media-preview__title">{{ current?.title ?? '媒体预览' }}</span>
        <span v-if="props.items.length" class="media-preview__counter">
          {{ currentIndex + 1 }} / {{ props.items.length }}
        </span>
      </div>
    </template>

    <div v-if="current" class="media-preview__stage">
      <button
        v-if="props.items.length > 1"
        type="button"
        class="media-preview__nav media-preview__nav--prev"
        aria-label="上一个"
        @click="step(-1)"
      >
        <el-icon><ArrowLeft /></el-icon>
      </button>

      <div class="media-preview__canvas">
        <MediaThumb :media="current" variant="fill" :show-kind="false" />
      </div>

      <button
        v-if="props.items.length > 1"
        type="button"
        class="media-preview__nav media-preview__nav--next"
        aria-label="下一个"
        @click="step(1)"
      >
        <el-icon><ArrowRight /></el-icon>
      </button>
    </div>

    <dl v-if="current" class="media-preview__meta">
      <div>
        <dt>类型</dt>
        <dd>{{ current.kind === 'video' ? '视频' : '相册' }}</dd>
      </div>
      <div>
        <dt>体积</dt>
        <dd>{{ formatFileSize(current.size) }}</dd>
      </div>
      <div v-if="current.duration">
        <dt>时长</dt>
        <dd>{{ formatDuration(current.duration) }}</dd>
      </div>
      <div>
        <dt>素材 ID</dt>
        <dd>{{ current.id }}</dd>
      </div>
    </dl>

    <div v-if="props.items.length > 1" class="media-preview__strip">
      <button
        v-for="(item, index) in props.items"
        :key="item.id"
        type="button"
        class="media-preview__thumb"
        :class="{ 'is-active': index === currentIndex }"
        :aria-label="`查看 ${item.title}`"
        @click="currentIndex = index"
      >
        <MediaThumb :media="item" :show-kind="false" />
      </button>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.media-preview {
  &__head {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }

  &__title {
    color: var(--app-ink);
    font-size: 15px;
    font-weight: 600;
  }

  &__counter {
    color: var(--app-ink-3);
    font-size: 12px;
  }

  &__stage {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__canvas {
    flex: 1;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background-color: var(--app-surface-3);
    border-radius: var(--app-radius);
  }

  &__nav {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--app-ink-2);
    cursor: pointer;
    background-color: var(--app-surface-2);
    border: 1px solid var(--app-border);
    border-radius: 50%;

    &:hover {
      color: var(--app-primary);
      border-color: var(--app-primary);
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    padding: 12px 0;
    margin-top: 12px;
    border-top: 1px solid var(--app-border);

    dt {
      color: var(--app-ink-3);
      font-size: 12px;
    }

    dd {
      margin: 0;
      color: var(--app-ink);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
  }

  &__strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
  }

  &__thumb {
    padding: 0;
    cursor: pointer;
    background: none;
    border: 2px solid transparent;
    border-radius: var(--app-radius);

    &.is-active {
      border-color: var(--app-primary);
    }
  }
}
</style>

