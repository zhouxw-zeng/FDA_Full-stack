<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({ name: 'SwipeAction' });

const props = withDefaults(
  defineProps<{
    maxOffset?: number;
    opened?: boolean;
  }>(),
  {
    maxOffset: 168,
    opened: false,
  },
);

const emit = defineEmits<{
  open: [];
  close: [];
  select: [];
}>();

const offset = ref(0);
const dragging = ref(false);
let startX = 0;
let startY = 0;
let startOffset = 0;
let horizontalDrag = false;

const contentStyle = computed(() => ({
  transform: `translateX(${offset.value}px)`,
  transition: dragging.value ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
}));

watch(
  () => props.opened,
  (opened) => {
    dragging.value = false;
    offset.value = opened ? -props.maxOffset : 0;
  },
  { immediate: true },
);

const panelStyle = computed(() => ({
  width: `${props.maxOffset}px`,
  transform: `translateX(${props.maxOffset + offset.value}px)`,
  transition: dragging.value ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  pointerEvents: offset.value < 0 ? ('auto' as const) : ('none' as const),
}));

function readPoint(event: TouchEvent): { x: number; y: number } | null {
  const touch = event.touches?.[0];
  if (!touch) {
    return null;
  }

  return {
    x: touch.clientX ?? touch.pageX ?? 0,
    y: touch.clientY ?? touch.pageY ?? 0,
  };
}

function handleTouchStart(event: TouchEvent): void {
  const point = readPoint(event);
  if (!point) {
    return;
  }

  startX = point.x;
  startY = point.y;
  startOffset = offset.value;
  horizontalDrag = false;
  dragging.value = true;
}

function handleTouchMove(event: TouchEvent): void {
  const point = readPoint(event);
  if (!point || !dragging.value) {
    return;
  }

  const deltaX = point.x - startX;
  const deltaY = point.y - startY;
  if (!horizontalDrag && Math.abs(deltaX) < 8) {
    return;
  }
  if (!horizontalDrag && Math.abs(deltaY) > Math.abs(deltaX)) {
    dragging.value = false;
    return;
  }

  horizontalDrag = true;
  offset.value = Math.min(0, Math.max(-props.maxOffset, startOffset + deltaX));
}

function handleTouchEnd(): void {
  if (!dragging.value) {
    return;
  }

  dragging.value = false;
  const shouldOpen = offset.value <= -props.maxOffset * 0.35;
  offset.value = shouldOpen ? -props.maxOffset : 0;
  if (shouldOpen) {
    emit('open');
  } else {
    emit('close');
  }
}

function close(): void {
  offset.value = 0;
  emit('close');
}

function handleContentTap(): void {
  if (offset.value < 0) {
    close();
    return;
  }
  emit('select');
}

defineExpose({ close });
</script>

<template>
  <view class="swipe-action">
    <view class="swipe-action__panel" :style="panelStyle">
      <slot name="actions" />
    </view>
    <view
      class="swipe-action__content"
      :style="contentStyle"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
      @tap="handleContentTap"
    >
      <slot />
    </view>
  </view>
</template>

<style scoped lang="scss">
.swipe-action {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 20rpx;
}

.swipe-action__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: #f2e5da;
  border-radius: 0 20rpx 20rpx 0;
}

.swipe-action__content {
  position: relative;
  z-index: 1;
  width: 100%;
  will-change: transform;
}
</style>
