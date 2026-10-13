<script setup lang="ts">
import { computed, watchEffect } from 'vue';

defineOptions({ name: 'UserAvatar' });

const props = withDefaults(
  defineProps<{
    nickname: string;
    src?: string;
    size?: number;
  }>(),
  {
    src: '',
    size: 30,
  },
);

/** 兜底成字符串，避免上游字段缺失时中断整页渲染 */
const displayName = computed(() => (typeof props.nickname === 'string' ? props.nickname : ''));

if (__DEV__) {
  watchEffect(() => {
    if (typeof props.nickname !== 'string') {
      console.warn('[UserAvatar] nickname 期望字符串，实际收到：', props.nickname);
    }
  });
}

/** 用昵称做同余哈希，保证同一个用户每次都是同一种颜色 */
const background = computed(() => {
  if (!displayName.value) {
    return 'hsl(200 10% 48%)';
  }
  let hash = 0;
  for (const char of displayName.value) {
    hash = (hash * 31 + char.codePointAt(0)!) % 360;
  }
  return `hsl(${hash} 32% 46%)`;
});

const initial = computed(() => Array.from(displayName.value)[0] ?? '?');
</script>

<template>
  <el-avatar
    :size="props.size"
    :src="props.src || undefined"
    :style="{ backgroundColor: background, fontSize: `${props.size * 0.42}px` }"
  >
    {{ initial }}
  </el-avatar>
</template>

