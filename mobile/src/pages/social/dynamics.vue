<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchUserDynamics } from '@/api/social';
import type { ForumDynamic } from '@/types';

defineOptions({ name: 'SocialDynamics' });

const userId = ref('');
const userNickname = ref('');
const items = ref<ForumDynamic[]>([]);
const total = ref(0);
const page = ref(1);
const size = 10;
const loading = ref(false);
const hasMore = computed(() => items.value.length < total.value);
const pageTitle = computed(() => (userNickname.value ? `${userNickname.value}的动态` : '用户动态'));

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

async function loadDynamics(reset = false): Promise<void> {
  if (!userId.value || loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchUserDynamics(userId.value, page.value, size);
    items.value = reset ? result.list : [...items.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载动态失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadDynamics();
  }
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(id)}` });
}

function goBack(): void {
  uni.navigateBack();
}

onLoad((options) => {
  userId.value = String(options?.id || '');
  userNickname.value = decodeURIComponent(String(options?.name || ''));
  void loadDynamics(true);
});
</script>

<template>
  <view class="social-dynamics-page rococo-canvas">
    <view class="dynamics-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">{{ pageTitle }}</text>
    </view>

    <scroll-view class="dynamics-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && items.length === 0" class="dynamics-state">正在加载动态</view>
      <view v-else-if="items.length === 0" class="dynamics-state">暂无已发布的动态</view>

      <view v-else class="dynamics-list">
        <view
          v-for="item in items"
          :key="item.id"
          class="dynamic-card"
          @tap="openDetail(item.id)"
        >
          <text class="dynamic-title">{{ previewText(item) }}</text>
          <text v-if="item.title && item.content" class="dynamic-content">{{ item.content }}</text>

          <scroll-view
            v-if="item.media.length"
            class="dynamic-media"
            scroll-x
            :show-scrollbar="false"
          >
            <view class="dynamic-media-row">
              <view v-for="asset in item.media" :key="asset.id" class="dynamic-media-cell">
                <image
                  v-if="asset.kind === 'album' && asset.url"
                  class="dynamic-media-thumb"
                  :src="resolveFileUrl(asset.url)"
                  mode="aspectFill"
                />
                <view v-else class="dynamic-media-thumb dynamic-media-thumb--video">
                  <text class="dynamic-media-glyph">▶</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="dynamic-foot">
            <text class="dynamic-topic">{{ item.topic }}</text>
            <text class="dynamic-meta">
              赞 {{ item.likeCount }} · {{ formatTime(item.createdAt) }}
            </text>
          </view>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="dynamics-state">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="dynamics-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.social-dynamics-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.dynamics-nav {
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
  min-width: 0;
  margin-left: 8rpx;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 36rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamics-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.dynamics-scroll :deep(.uni-scroll-view),
.dynamic-media :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.dynamics-scroll :deep(.uni-scroll-view)::-webkit-scrollbar,
.dynamic-media :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.dynamics-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.dynamic-card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.2);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9),
    0 10rpx 24rpx rgba(137, 91, 116, 0.07);
}

.dynamic-title {
  display: block;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamic-content {
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

.dynamic-media {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
  scrollbar-width: none;
}

.dynamic-media-row {
  display: flex;
}

.dynamic-media-cell {
  flex: none;
  width: 160rpx;
  height: 160rpx;
  margin-right: 14rpx;
  overflow: hidden;
  background: $rococo-stucco;
  border-radius: 8rpx;
}

.dynamic-media-thumb {
  display: block;
  width: 100%;
  height: 100%;
}

.dynamic-media-thumb--video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $rococo-lilac;
}

.dynamic-media-glyph {
  color: $rococo-paper;
  font-size: 40rpx;
}

.dynamic-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.dynamic-topic {
  padding: 2rpx 12rpx;
  color: $rococo-gold-rich;
  font-size: 19rpx;
  background: rgba($rococo-gold-pale, 0.4);
  border-radius: 16rpx;
}

.dynamic-meta {
  color: $rococo-muted;
  font-size: 21rpx;
}
</style>
