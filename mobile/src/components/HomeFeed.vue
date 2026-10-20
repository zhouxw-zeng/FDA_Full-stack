<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { fetchForumDynamics, searchForumDynamicsByTitle } from '@/api/forum';
import { resolveFileUrl } from '@/api/files';
import FeedSearch from '@/components/FeedSearch.vue';
import { usePullRefresh } from '@/composables/usePullRefresh';
import { useUserStore } from '@/stores/user';
import type { ForumDynamic } from '@/types';

defineOptions({ name: 'HomeFeed' });

const props = withDefaults(
  defineProps<{
    resetToken?: number;
  }>(),
  {
    resetToken: 0,
  },
);

interface FeedCard extends ForumDynamic {
  cardTitle: string;
  imageHeight: number;
  colorIndex: number;
}

interface WaterfallColumns {
  left: FeedCard[];
  right: FeedCard[];
}

const userStore = useUserStore();
const items = ref<ForumDynamic[]>([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const size = 10;
const activeKeyword = ref('');
const hasMore = computed(() => items.value.length < total.value);

const {
  pullDistance,
  pullText,
  scrollIntoView,
  onScroll,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  reset,
} = usePullRefresh({
  onRefresh: () => loadFeed(true),
});

function toFeedCard(item: ForumDynamic, index: number): FeedCard {
  const firstMedia = item.media?.[0];
  const seed = firstMedia?.seed ?? index + 1;

  return {
    ...item,
    cardTitle: item.title || firstMedia?.title || item.content,
    imageHeight: 240 + (seed % 3) * 70,
    colorIndex: index % 3,
  };
}

const columns = computed<WaterfallColumns>(() => {
  const left: FeedCard[] = [];
  const right: FeedCard[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.value.forEach((item, index) => {
    const card = toFeedCard(item, index);
    const estimatedHeight = card.imageHeight + 220;

    if (leftHeight <= rightHeight) {
      left.push(card);
      leftHeight += estimatedHeight;
    } else {
      right.push(card);
      rightHeight += estimatedHeight;
    }
  });

  return { left, right };
});

async function loadFeed(reset = false): Promise<void> {
  if (!userStore.isLoggedIn || loading.value) {
    return;
  }

  loading.value = true;
  if (reset) {
    page.value = 1;
  }

  try {
    const result = activeKeyword.value
      ? await searchForumDynamicsByTitle(activeKeyword.value, page.value, size)
      : await fetchForumDynamics({
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

function handleSearch(keyword: string): void {
  activeKeyword.value = keyword;
  void loadFeed(true);
}

function handleSearchReset(): void {
  activeKeyword.value = '';
  void loadFeed(true);
}

function goLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

function goDetail(id: string): void {
  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(id)}` });
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
  () => props.resetToken,
  () => {
    activeKeyword.value = '';
    void reset();
  },
);

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
    <view class="feed-header">
      <view class="feed-title-group">
        <text class="feed-kicker">Moments</text>
        <text class="feed-title">动态</text>
      </view>
      <FeedSearch @search="handleSearch" @reset="handleSearchReset" />
    </view>

    <scroll-view
      v-if="userStore.isLoggedIn"
      class="waterfall-scroll"
      scroll-y
      :show-scrollbar="false"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
      @scroll="onScroll"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @scrolltolower="loadMore"
    >
      <view id="list-top"></view>
      <view v-if="pullDistance > 0" class="pull-refresh" :style="{ height: `${pullDistance}px` }">
        <text class="pull-refresh-text">{{ pullText }}</text>
      </view>

      <view v-if="loading && items.length === 0" class="state-panel">正在加载动态</view>
      <view v-else-if="items.length === 0" class="state-panel">暂无动态</view>

      <view v-else class="waterfall">
        <view class="waterfall-column">
          <view
            v-for="card in columns.left"
            :key="card.id"
            class="feed-card"
            @tap="goDetail(card.id)"
          >
            <view class="card-image-wrap">
              <image
                v-if="card.media?.[0]?.url"
                class="card-image"
                :src="resolveFileUrl(card.media[0].url)"
                mode="aspectFill"
                :style="{ height: `${card.imageHeight}rpx` }"
              />
              <view
                v-else
                class="card-placeholder"
                :class="`card-placeholder--${card.colorIndex}`"
                :style="{ height: `${card.imageHeight}rpx` }"
              >
                <text class="placeholder-topic">{{ card.topic }}</text>
              </view>
            </view>

            <text class="card-title">{{ card.cardTitle }}</text>

            <view class="card-footer">
              <text class="author-name">{{ card.author.nickname }}</text>
              <text class="like-count">赞 {{ formatCount(card.likeCount) }}</text>
            </view>
          </view>
        </view>

        <view class="waterfall-column">
          <view
            v-for="card in columns.right"
            :key="card.id"
            class="feed-card"
            @tap="goDetail(card.id)"
          >
            <view class="card-image-wrap">
              <image
                v-if="card.media?.[0]?.url"
                class="card-image"
                :src="resolveFileUrl(card.media[0].url)"
                mode="aspectFill"
                :style="{ height: `${card.imageHeight}rpx` }"
              />
              <view
                v-else
                class="card-placeholder"
                :class="`card-placeholder--${card.colorIndex}`"
                :style="{ height: `${card.imageHeight}rpx` }"
              >
                <text class="placeholder-topic">{{ card.topic }}</text>
              </view>
            </view>

            <text class="card-title">{{ card.cardTitle }}</text>

            <view class="card-footer">
              <text class="author-name">{{ card.author.nickname }}</text>
              <text class="like-count">赞 {{ formatCount(card.likeCount) }}</text>
            </view>
          </view>
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
  background: #f7f8fa;
}

.feed-header {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  width: 100%;
  height: 120rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.feed-title-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.feed-kicker {
  color: $rococo-gold;
  font-size: 20rpx;
  line-height: 1.4;
  text-transform: uppercase;
}

.feed-title {
  margin-top: 4rpx;
  color: #222222;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 1.2;
}

.waterfall-scroll {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 20rpx 24rpx 32rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

#list-top {
  height: 0;
}

.pull-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
}

.pull-refresh-text {
  line-height: 1;
}

/* #ifdef H5 */
/* H5 端 scroll-view 的真实滚动容器是内部 .uni-scroll-view */
.waterfall-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.waterfall-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.waterfall {
  display: flex;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
}

.waterfall-column {
  display: flex;
  flex: none;
  flex-direction: column;
  width: calc(50% - 10rpx);
  min-width: 0;
}

.waterfall-column + .waterfall-column {
  margin-left: 20rpx;
}

.feed-card {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 100%;
  margin-bottom: 24rpx;
}

.card-image-wrap {
  flex: none;
  width: 100%;
  min-height: 200rpx;
  overflow: hidden;
  background: #ffffff;
  border-radius: 16rpx;
}

.card-image {
  display: block;
  width: 100%;
  min-height: 200rpx;
}

.card-placeholder {
  display: flex;
  align-items: flex-end;
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.card-placeholder--0 {
  background: linear-gradient(150deg, #fcecc1, #e2cc9a);
}

.card-placeholder--1 {
  background: linear-gradient(150deg, #e7e2f0, #d8c9e1);
}

.card-placeholder--2 {
  background: linear-gradient(150deg, #f4d8d0, #d9cbc1);
}

.placeholder-topic {
  max-width: 100%;
  overflow: hidden;
  color: #6a4a3a;
  font-size: 24rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-title {
  display: -webkit-box;
  flex: none;
  margin-top: 14rpx;
  max-height: 120rpx;
  overflow: hidden;
  color: #222222;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.author-name {
  min-width: 0;
  overflow: hidden;
  color: #999999;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.like-count {
  flex: none;
  margin-left: 12rpx;
  color: #999999;
  font-size: 22rpx;
}

.state-panel,
.loading-more {
  padding: 44rpx 0;
  color: #999999;
  font-size: 24rpx;
  text-align: center;
}

.guest-state {
  margin: 32rpx;
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
