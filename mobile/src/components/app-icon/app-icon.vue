<script setup lang="ts">
import { computed } from 'vue';

import { APP_ICONS, type AppIconName } from '@/constants/icons';

defineOptions({ name: 'AppIcon' });

const props = withDefaults(
  defineProps<{
    name: AppIconName;
    size?: number;
    color?: string;
  }>(),
  {
    size: 32,
    color: 'currentColor',
  },
);

const glyph = computed(() => APP_ICONS[props.name]);
const iconStyle = computed(() => ({
  color: props.color,
  fontSize: `${props.size}rpx`,
}));
</script>

<template>
  <text class="app-icon" :style="iconStyle">{{ glyph }}</text>
</template>
