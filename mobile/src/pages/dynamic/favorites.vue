<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchMyFavoritedForumDynamics } from '@/api/forum';
import type { ForumDynamic } from '@/types';

defineOptions({ name: 'DynamicFavorites' });

const items = ref<ForumDynamic[]>([]);
const total = ref(0);
const page = ref(1);
const size = 10;
const loading = ref(false);
const hasMore = computed(() => items.value.length < total.value);

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function previewText(item: ForumDynamic): string {
  return item.title || item.content || '未填写文案';
}

async function loadFavorites(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchMyFavoritedForumDynamics(page.value, size);
    items.value = reset ? result.list : [...items.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadFavorites();
  }
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(id)}` });
}

function goBack(): void {
  uni.navigateBack();
}

onLoad(() => {
  void loadFavorites(true);
});
</script>

<template>
  <view class="favorites-page rococo-canvas">
    <view class="favorites-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">我的收藏</text>
    </view>

    <scroll-view
      class="favorites-scroll"
      scroll-y
      :show-scrollbar="false"
      @scrolltolower="loadMore"
    >
      <view v-if="loading && items.length === 0" class="favorites-state">正在加载收藏</view>
      <view v-else-if="items.length === 0" class="favorites-state">还没有收藏过动态</view>

      <view v-else class="favorites-list">
        <view
          v-for="item in items"
          :key="item.id"
          class="favorites-card"
          @tap="openDetail(item.id)"
        >
          <view class="favorites-head">
            <text class="favorites-title">{{ previewText(item) }}</text>
            <text class="favorites-badge">已收藏</text>
          </view>

          <text v-if="item.title && item.content" class="favorites-content">
            {{ item.content }}
          </text>

          <scroll-view
            v-if="item.media.length"
            class="favorites-media"
            scroll-x
            :show-scrollbar="false"
          >
            <view class="favorites-media-row">
              <view v-for="asset in item.media" :key="asset.id" class="favorites-media-cell">
                <image
                  v-if="asset.kind === 'album' && asset.url"
                  class="favorites-media-thumb"
                  :src="resolveFileUrl(asset.url)"
                  mode="aspectFill"
                />
                <view v-else class="favorites-media-thumb favorites-media-thumb--video">
                  <text class="favorites-media-glyph">▶</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="favorites-foot">
            <text class="favorites-author">{{ item.author.nickname }}</text>
            <text class="favorites-meta">
              收藏 {{ item.favoriteCount }} · {{ formatTime(item.createdAt) }}
            </text>
          </view>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="favorites-state">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="favorites-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.favorites-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.favorites-nav {
  display: flex;
  flex: none;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  border-bottom: 1rpx solid $rococo-line;
  background: rgba($rococo-cream, 0.92);
}

.nav-back {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  padding: 0;
  line-height: 1;
  background: transparent;
  border: none;
}

.nav-title {
  flex: 1;
  margin-left: 8rpx;
  color: $rococo-ink;
  font-size: 38rpx;
  font-weight: 600;
}

.favorites-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.favorites-scroll :deep(.uni-scroll-view),
.favorites-media :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.favorites-scroll :deep(.uni-scroll-view)::-webkit-scrollbar,
.favorites-media :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.favorites-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.favorites-card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 12rpx 30rpx rgba(137, 91, 116, 0.08);
}

.favorites-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.favorites-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorites-badge {
  flex: none;
  margin-left: 16rpx;
  padding: 4rpx 14rpx;
  color: $rococo-gold-rich;
  font-size: 20rpx;
  background: rgba($rococo-gold-pale, 0.46);
  border-radius: 20rpx;
}

.favorites-content {
  display: -webkit-box;
  margin-top: 12rpx;
  max-height: 96rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 24rpx;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.favorites-media {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
  scrollbar-width: none;
}

.favorites-media-row {
  display: flex;
}

.favorites-media-cell {
  flex: none;
  width: 160rpx;
  height: 160rpx;
  margin-right: 14rpx;
  overflow: hidden;
  background: $rococo-stucco;
  border-radius: 8rpx;
}

.favorites-media-thumb {
  display: block;
  width: 100%;
  height: 100%;
}

.favorites-media-thumb--video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $rococo-lilac;
}

.favorites-media-glyph {
  color: $rococo-paper;
  font-size: 40rpx;
}

.favorites-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.favorites-author {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorites-meta {
  flex: none;
  margin-left: 16rpx;
  color: $rococo-muted;
  font-size: 21rpx;
}
</style>
