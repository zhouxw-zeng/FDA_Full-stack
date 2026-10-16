<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchMyForumDynamics } from '@/api/forum';
import type { ForumDynamic, MyForumDynamicStatus } from '@/types';

defineOptions({ name: 'DynamicRecords' });

interface StatusTab {
  key: MyForumDynamicStatus;
  label: string;
  note: string;
}

const tabs: StatusTab[] = [
  { key: 'pending', label: '待审批', note: '审核通过后展示在首页' },
  { key: 'published', label: '已通过', note: '已展示在首页动态中' },
  { key: 'rejected', label: '驳回', note: '可按审核意见修改后重新提交' },
];

const activeStatus = ref<MyForumDynamicStatus>('pending');
const items = ref<ForumDynamic[]>([]);
const total = ref(0);
const page = ref(1);
const size = 10;
const loading = ref(false);
const hasMore = computed(() => items.value.length < total.value);

const activeTab = computed(() => tabs.find((tab) => tab.key === activeStatus.value) ?? tabs[0]);

const statusLabels: Record<ForumDynamic['auditStatus'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '驳回',
};

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

async function loadRecords(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchMyForumDynamics({
      page: page.value,
      size,
      status: activeStatus.value,
    });
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

function switchStatus(status: MyForumDynamicStatus): void {
  if (status === activeStatus.value) {
    return;
  }

  activeStatus.value = status;
  items.value = [];
  total.value = 0;
  void loadRecords(true);
}

function loadMore(): void {
  if (hasMore.value) {
    void loadRecords();
  }
}

function openDetail(id: string): void {
  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(id)}` });
}

function goBack(): void {
  uni.navigateBack();
}

onLoad((options) => {
  const status = options?.status as MyForumDynamicStatus | undefined;
  if (status && tabs.some((tab) => tab.key === status)) {
    activeStatus.value = status;
  }

  void loadRecords(true);
});
</script>

<template>
  <view class="records-page rococo-canvas">
    <view class="records-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">记录</text>
    </view>

    <view class="status-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="status-tab"
        :class="{ 'status-tab--active': tab.key === activeStatus }"
        @tap="switchStatus(tab.key)"
      >
        <text class="status-tab-label">{{ tab.label }}</text>
      </view>
    </view>

    <view class="status-note">{{ activeTab.note }}</view>

    <scroll-view class="records-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && items.length === 0" class="records-state">正在加载记录</view>
      <view v-else-if="items.length === 0" class="records-state">暂无{{ activeTab.label }}记录</view>

      <view v-else class="records-list">
        <view
          v-for="item in items"
          :key="item.id"
          class="record-card"
          @tap="openDetail(item.id)"
        >
          <view class="record-head">
            <text class="record-title">{{ previewText(item) }}</text>
            <text class="record-status" :class="`record-status--${item.auditStatus}`">
              {{ statusLabels[item.auditStatus] }}
            </text>
          </view>

          <text v-if="item.title && item.content" class="record-content">{{ item.content }}</text>

          <scroll-view
            v-if="item.media.length"
            class="record-media"
            scroll-x
            :show-scrollbar="false"
          >
            <view class="record-media-row">
              <view v-for="asset in item.media" :key="asset.id" class="record-media-cell">
                <image
                  v-if="asset.kind === 'album' && asset.url"
                  class="record-media-thumb"
                  :src="resolveFileUrl(asset.url)"
                  mode="aspectFill"
                />
                <view v-else class="record-media-thumb record-media-thumb--video">
                  <text class="record-media-glyph">▶</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="record-foot">
            <text class="record-time">{{ formatTime(item.createdAt) }}</text>
            <text class="record-topic">{{ item.topic }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="records-state">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="records-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.records-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.records-nav {
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

.status-tabs {
  display: flex;
  flex: none;
  margin: 24rpx 24rpx 0;
  padding: 6rpx;
  background: rgba($rococo-paper, 0.86);
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
}

.status-tab {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 66rpx;
  border-radius: 6rpx;
}

.status-tab--active {
  background: linear-gradient(135deg, rgba($rococo-pink-light, 0.72), rgba($rococo-pink-blue, 0.6));
  box-shadow: 0 6rpx 16rpx rgba(137, 91, 116, 0.14);
}

.status-tab-label {
  color: $rococo-muted;
  font-size: 25rpx;
}

.status-tab--active .status-tab-label {
  color: $rococo-rose;
  font-weight: 600;
}

.status-note {
  flex: none;
  padding: 16rpx 28rpx 0;
  color: $rococo-muted;
  font-size: 21rpx;
}

.records-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.records-scroll :deep(.uni-scroll-view),
.record-media :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.records-scroll :deep(.uni-scroll-view)::-webkit-scrollbar,
.record-media :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.records-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.record-card {
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

.record-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.record-title {
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

.record-status {
  flex: none;
  margin-left: 16rpx;
  padding: 4rpx 14rpx;
  font-size: 20rpx;
  border-radius: 20rpx;
}

.record-status--pending {
  color: $rococo-gold-rich;
  background: rgba($rococo-gold-pale, 0.5);
}

.record-status--approved {
  color: #3f7f6b;
  background: rgba($rococo-sage, 0.42);
}

.record-status--rejected {
  color: $rococo-rose;
  background: rgba($rococo-blush, 0.5);
}

.record-content {
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

.record-media {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
  scrollbar-width: none;
}

.record-media-row {
  display: flex;
}

.record-media-cell {
  flex: none;
  width: 160rpx;
  height: 160rpx;
  margin-right: 14rpx;
  overflow: hidden;
  border-radius: 8rpx;
  background: $rococo-stucco;
}

.record-media-thumb {
  display: block;
  width: 100%;
  height: 100%;
}

.record-media-thumb--video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $rococo-lilac;
}

.record-media-glyph {
  color: $rococo-paper;
  font-size: 40rpx;
}

.record-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.record-time,
.record-topic {
  color: $rococo-muted;
  font-size: 21rpx;
}
</style>
