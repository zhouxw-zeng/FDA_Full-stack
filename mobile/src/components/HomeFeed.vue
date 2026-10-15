<script setup lang="ts">
defineOptions({ name: 'HomeFeed' });

import { computed, onMounted, ref, watch } from 'vue';

import { fetchForumDynamics } from '@/api/forum';
import { useUserStore } from '@/stores/user';
import type { ForumDynamic } from '@/types';

const userStore = useUserStore();
const items = ref<ForumDynamic[]>([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const size = 10;
const hasMore = computed(() => items.value.length < total.value);

async function loadFeed(reset = false): Promise<void> {
  if (!userStore.isLoggedIn || loading.value) {
    return;
  }

  loading.value = true;
  if (reset) {
    page.value = 1;
  }

  try {
    const result = await fetchForumDynamics({
      page: page.value,
      size,
      auditStatus: 'approved',
      enabled: 1,
    });
    items.value = reset ? result.list : [...items.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } finally {
    loading.value = false;
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadFeed();
  }
}

function goLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

function formatCount(value: number): string {
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(1)}w`;
  }
  return String(value);
}

onMounted(() => {
  void loadFeed(true);
});

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn && items.value.length === 0) {
      void loadFeed(true);
    }
  },
);
</script>

<template>
  <view class="feed-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Salon de Lumiere</text>
        <text class="page-title">流光动态</text>
      </view>
      <button v-if="userStore.isLoggedIn" class="mini-button" @tap="loadFeed(true)">刷新</button>
    </view>

    <scroll-view
      v-if="userStore.isLoggedIn"
      class="feed-scroll"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view v-if="loading && items.length === 0" class="state-panel rococo-panel">
        <text class="state-text">正在整理今日动态</text>
      </view>
      <view v-else-if="items.length === 0" class="state-panel rococo-panel">
        <text class="state-text">暂无动态</text>
      </view>

      <view v-for="item in items" :key="item.id" class="feed-card rococo-panel">
        <view class="feed-card-top">
          <view class="author-mark">{{ item.author.nickname.slice(0, 1) }}</view>
          <view class="author-copy">
            <text class="author-name">{{ item.author.nickname }}</text>
            <text class="feed-topic">{{ item.topic }}</text>
          </view>
          <text v-if="item.pinned" class="pinned-mark">置顶</text>
        </view>

        <text class="feed-content">{{ item.content }}</text>

        <view class="feed-meta">
          <text>赞 {{ formatCount(item.likeCount) }}</text>
          <text>评 {{ formatCount(item.commentCount) }}</text>
          <text>享 {{ formatCount(item.shareCount) }}</text>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="loading-more">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="loading-more">已经到底了</view>
    </scroll-view>

    <view v-else class="guest-state rococo-panel">
      <text class="guest-title">登录后查看动态</text>
      <text class="guest-copy">社区动态与 AI 中控需要登录状态。</text>
      <button class="primary-button" @tap="goLogin">前往登录</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.feed-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
}

.header-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.eyebrow {
  color: $rococo-gold;
  font-size: 20rpx;
  letter-spacing: 2rpx;
  line-height: 1.4;
  text-transform: uppercase;
}

.page-title {
  margin-top: 4rpx;
  color: $rococo-ink;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.mini-button {
  flex: none;
  min-width: 108rpx;
  height: 60rpx;
  padding: 0 24rpx;
  color: $rococo-rose;
  font-size: 24rpx;
  line-height: 58rpx;
  background: $rococo-paper;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
}

.feed-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 28rpx 32rpx;
  box-sizing: border-box;
}

.feed-card {
  margin-bottom: 20rpx;
  padding: 26rpx;
}

.feed-card-top {
  display: flex;
  align-items: center;
}

.author-mark {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  color: $rococo-rose;
  font-size: 26rpx;
  font-weight: 600;
  background: $rococo-blush;
  border: 1rpx solid rgba($rococo-rose, 0.2);
  border-radius: 8rpx;
}

.author-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.author-name {
  overflow: hidden;
  color: $rococo-ink;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-topic {
  margin-top: 4rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.pinned-mark {
  flex: none;
  margin-left: 16rpx;
  padding: 4rpx 12rpx;
  color: $rococo-gold;
  font-size: 20rpx;
  background: rgba($rococo-gold-soft, 0.18);
  border: 1rpx solid rgba($rococo-gold, 0.22);
  border-radius: 8rpx;
}

.feed-content {
  display: block;
  margin-top: 22rpx;
  color: $rococo-ink;
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
}

.feed-meta {
  display: flex;
  gap: 28rpx;
  margin-top: 24rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.state-panel {
  padding: 52rpx 28rpx;
  text-align: center;
}

.state-text {
  color: $rococo-muted;
  font-size: 26rpx;
}

.loading-more {
  padding: 18rpx 0 28rpx;
  color: $rococo-muted;
  font-size: 22rpx;
  text-align: center;
}

.guest-state {
  margin: 28rpx;
  padding: 56rpx 36rpx;
  text-align: center;
}

.guest-title {
  display: block;
  color: $rococo-ink;
  font-size: 32rpx;
  font-weight: 600;
}

.guest-copy {
  display: block;
  margin: 12rpx 0 28rpx;
  color: $rococo-muted;
  font-size: 24rpx;
  line-height: 1.6;
}
</style>
