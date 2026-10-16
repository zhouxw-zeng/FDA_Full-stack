<script setup lang="ts">
import { computed } from 'vue';
import { VideoCamera } from '@element-plus/icons-vue';

import type { MediaItem } from '@/types';
import { formatDuration } from '@/utils/format';

defineOptions({ name: 'MediaThumb' });

const props = withDefaults(
  defineProps<{
    media: MediaItem;
    /** 填充模式用于大图预览，固定比例用于列表缩略图 */
    variant?: 'tile' | 'fill';
    showKind?: boolean;
  }>(),
  {
    variant: 'tile',
    showKind: true,
  },
);

/**
 * 后端只返回 seed（真实项目里换成图片/封面地址）。
 * 这里用 seed 生成确定性的抽象影像，保证列表、预览、详情看到的是同一张图。
 */
const palette = computed(() => {
  if (!props.media) {
    if (__DEV__) {
      console.warn('[MediaThumb] 未收到媒体对象');
    }
    return {
      '--tile-a': 'hsl(200 10% 40%)',
      '--tile-b': 'hsl(200 12% 26%)',
      '--tile-c': 'hsl(180 10% 58%)',
    } as Record<string, string>;
  }
  const base = props.media.seed;
  const hue = base % 360;
  return {
    '--tile-a': `hsl(${hue} 34% 40%)`,
    '--tile-b': `hsl(${(hue + 58) % 360} 42% 20%)`,
    '--tile-c': `hsl(${(hue + 168) % 360} 46% 62%)`,
  } as Record<string, string>;
});
</script>

<template>
  <div
    class="media-thumb"
    :class="`media-thumb--${props.variant}`"
    :style="palette"
    role="img"
    :aria-label="props.media?.title ?? '媒体素材'"
  >
    <img
      v-if="props.media?.url"
      class="media-thumb__image"
      :src="props.media.url"
      :alt="props.media.title"
      loading="lazy"
    />
    <span v-if="props.showKind" class="media-thumb__kind">
      {{ props.media?.kind === 'video' ? '视频' : '相册' }}
    </span>
    <span v-if="props.media?.kind === 'video'" class="media-thumb__play">
      <el-icon><VideoCamera /></el-icon>
    </span>
    <span
      v-if="props.media?.kind === 'video' && props.media.duration"
      class="media-thumb__duration"
    >
      {{ formatDuration(props.media.duration) }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.media-thumb {
  position: relative;
  overflow: hidden;
  background-color: var(--app-surface-3);
  background-image:
    linear-gradient(180deg, transparent 0 54%, rgba(6, 12, 11, 0.42) 54% 100%),
    radial-gradient(120% 92% at 22% 16%, var(--tile-c) 0%, transparent 56%),
    linear-gradient(158deg, var(--tile-a) 0%, var(--tile-b) 100%);

  &--tile {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: var(--app-radius);
  }

  &--fill {
    width: 100%;
    height: 100%;
  }

  &__kind {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 1px 6px;
    color: #fff;
    font-size: 11px;
    line-height: 16px;
    background-color: rgba(12, 20, 19, 0.55);
    border-radius: var(--app-radius-sm);
    backdrop-filter: blur(2px);
  }

  &__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__play {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #fff;
    font-size: 16px;
    background-color: rgba(12, 20, 19, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  &__duration {
    position: absolute;
    right: 6px;
    bottom: 6px;
    padding: 1px 6px;
    color: #fff;
    font-size: 11px;
    line-height: 16px;
    background-color: rgba(12, 20, 19, 0.6);
    border-radius: var(--app-radius-sm);
  }
}
</style>
