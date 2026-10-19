<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchMyLikedForumDynamics } from '@/api/forum';
import type { ForumDynamic } from '@/types';

defineOptions({ name: 'DynamicLiked' });

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

async function loadLiked(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchMyLikedForumDynamics(page.value, size);
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
    void loadLiked();
  }
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(id)}` });
}

function goBack(): void {
  uni.navigateBack();
}

onLoad(() => {
  void loadLiked(true);
});
</script>

<template>
  <view class="liked-page rococo-canvas">
    <view class="liked-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">我的喜欢</text>
    </view>

    <scroll-view class="liked-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && items.length === 0" class="liked-state">正在加载点赞记录</view>
      <view v-else-if="items.length === 0" class="liked-state">还没有点赞过动态</view>

      <view v-else class="liked-list">
        <view
          v-for="item in items"
          :key="item.id"
          class="liked-card"
          @tap="openDetail(item.id)"
        >
          <view class="liked-head">
            <text class="liked-title">{{ previewText(item) }}</text>
            <text class="liked-badge">已点赞</text>
          </view>

          <text v-if="item.title && item.content" class="liked-content">{{ item.content }}</text>

          <scroll-view
            v-if="item.media.length"
            class="liked-media"
            scroll-x
            :show-scrollbar="false"
          >
            <view class="liked-media-row">
              <view v-for="asset in item.media" :key="asset.id" class="liked-media-cell">
                <image
                  v-if="asset.kind === 'album' && asset.url"
                  class="liked-media-thumb"
                  :src="resolveFileUrl(asset.url)"
                  mode="aspectFill"
                />
                <view v-else class="liked-media-thumb liked-media-thumb--video">
                  <text class="liked-media-glyph">▶</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="liked-foot">
            <text class="liked-author">{{ item.author.nickname }}</text>
            <text class="liked-meta">赞 {{ item.likeCount }} · {{ formatTime(item.createdAt) }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="liked-state">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="liked-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.liked-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.liked-nav {
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

.liked-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.liked-scroll :deep(.uni-scroll-view),
.liked-media :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.liked-scroll :deep(.uni-scroll-view)::-webkit-scrollbar,
.liked-media :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.liked-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.liked-card {
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

.liked-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.liked-title {
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

.liked-badge {
  flex: none;
  margin-left: 16rpx;
  padding: 4rpx 14rpx;
  color: $rococo-rose;
  font-size: 20rpx;
  background: rgba($rococo-blush, 0.5);
  border-radius: 20rpx;
}

.liked-content {
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

.liked-media {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
  scrollbar-width: none;
}

.liked-media-row {
  display: flex;
}

.liked-media-cell {
  flex: none;
  width: 160rpx;
  height: 160rpx;
  margin-right: 14rpx;
  overflow: hidden;
  background: $rococo-stucco;
  border-radius: 8rpx;
}

.liked-media-thumb {
  display: block;
  width: 100%;
  height: 100%;
}

.liked-media-thumb--video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $rococo-lilac;
}

.liked-media-glyph {
  color: $rococo-paper;
  font-size: 40rpx;
}

.liked-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.liked-author {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.liked-meta {
  flex: none;
  margin-left: 16rpx;
  color: $rococo-muted;
  font-size: 21rpx;
}
</style>
