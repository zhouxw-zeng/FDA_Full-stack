<script setup lang="ts">
import type { TabItem } from './types';

defineOptions({ name: 'AppTabBar' });

defineProps<{
  active: string;
  items: TabItem[];
}>();

const emit = defineEmits<{
  change: [key: string];
}>();

function selectTab(key: string): void {
  emit('change', key);
}
</script>

<template>
  <view class="tab-bar">
    <view
      v-for="item in items"
      :key="item.key"
      class="tab-item"
      :class="{ 'tab-item--active': active === item.key }"
      :aria-label="item.label"
      hover-class="tab-item--hover"
      @tap="selectTab(item.key)"
    >
      <view class="tab-icon">
        <image
          class="tab-image"
          :src="active === item.key ? item.activeIcon : item.icon"
          mode="aspectFit"
        />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.tab-bar {
  position: relative;
  z-index: 20;
  display: flex;
  flex: none;
  align-items: stretch;
  min-height: 104rpx;
  padding: 8rpx 20rpx;
  padding-bottom: calc(8rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(8rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $rococo-line;
  background:
    linear-gradient(
      180deg,
      rgba($rococo-porcelain, 0.96),
      rgba($rococo-cream, 0.98) 58%,
      rgba($rococo-pink-blue, 0.16)
    );
  box-shadow: 0 -10rpx 28rpx rgba(137, 91, 116, 0.08);
}

.tab-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  color: $rococo-muted;
  border-radius: 8rpx;
  transition: transform 180ms ease;
}

.tab-item--hover {
  background: rgba($rococo-pink-light, 0.16);
}

.tab-item--active {
  transform: translateY(-2rpx) scale(1.03);
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  margin-top: -14rpx;
  overflow: hidden;
  background: rgba($rococo-paper, 0.6);
  border: 2rpx solid rgba($rococo-paper, 0.86);
  border-radius: 50%;
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    margin-top 180ms ease,
    transform 180ms ease;
}

.tab-item--active .tab-icon {
  margin-top: -30rpx;
  background: $rococo-paper;
  border-color: $rococo-paper;
  border-radius: 50%;
  box-shadow:
    0 12rpx 26rpx rgba($rococo-rose, 0.28),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.94);
  transform: scale(1.08);
}

.tab-image {
  display: block;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transform-origin: center center;
}
</style>
