<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import {
  connectNotificationSocket,
  type NotificationNewPayload,
  type NotificationSocketHandle,
} from '@/api/notification-socket';
import {
  clearForumNotifications,
  deleteForumNotification,
  fetchForumNotifications,
  fetchUnreadNotificationCount,
  markAllForumNotificationsRead,
  markForumNotificationRead,
} from '@/api/notifications';
import type { ForumNotification } from '@/types';

defineOptions({ name: 'ProfileNotifications' });

const items = ref<ForumNotification[]>([]);
const total = ref(0);
const page = ref(1);
const size = 15;
const loading = ref(false);
const clearing = ref(false);
const unreadCount = ref(0);
const hasMore = computed(() => items.value.length < total.value);

const typeLabels: Record<ForumNotification['type'], string> = {
  dynamic_like: '点赞',
  dynamic_comment: '评论',
  comment_reply: '回复',
};

let socketHandle: NotificationSocketHandle | null = null;

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (sameDay) {
    return `${hours}:${minutes}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function actorName(item: ForumNotification): string {
  return item.actor?.nickname || '用户';
}

function actorInitial(item: ForumNotification): string {
  return actorName(item).slice(0, 1);
}

function actorAvatar(item: ForumNotification): string {
  return resolveFileUrl(item.actor?.avatar);
}

function dynamicTitle(item: ForumNotification): string {
  return item.dynamic?.title || item.dynamic?.content || '动态已删除';
}

/** 同步未读数给「我的」页角标 */
function syncUnread(): void {
  uni.$emit('notification:unread-changed', unreadCount.value);
}

async function loadUnread(): Promise<void> {
  try {
    const result = await fetchUnreadNotificationCount();
    unreadCount.value = result.count;
  } catch {
    unreadCount.value = 0;
  }
  syncUnread();
}

async function loadNotifications(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchForumNotifications(page.value, size);
    items.value = reset ? result.list : [...items.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载消息失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function applyIncoming(payload: NotificationNewPayload): void {
  unreadCount.value = payload.unreadCount;
  syncUnread();
  if (items.value.some((item) => item.id === payload.notification.id)) {
    return;
  }

  items.value = [payload.notification, ...items.value];
  total.value += 1;
  uni.showToast({ title: payload.notification.message, icon: 'none' });
}

function setupSocket(): void {
  socketHandle = connectNotificationSocket({
    onNew: applyIncoming,
  });
}

function openNotification(item: ForumNotification): void {
  if (!item.isRead) {
    item.isRead = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    syncUnread();
    void markForumNotificationRead(item.id).catch(() => undefined);
  }

  uni.navigateTo({ url: `/pages/dynamic/detail?id=${encodeURIComponent(item.dynamicId)}` });
}

async function markAllRead(): Promise<void> {
  if (unreadCount.value === 0) {
    return;
  }

  try {
    await markAllForumNotificationsRead();
    items.value = items.value.map((item) => ({ ...item, isRead: true }));
    unreadCount.value = 0;
    syncUnread();
    uni.showToast({ title: '已全部标记为已读', icon: 'none' });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  }
}

function confirmDialog(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      confirmText: '确认',
      cancelText: '取消',
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false),
    });
  });
}

async function removeNotification(item: ForumNotification): Promise<void> {
  const confirmed = await confirmDialog('删除这条消息', '删除后无法恢复');
  if (!confirmed) {
    return;
  }

  try {
    await deleteForumNotification(item.id);
    items.value = items.value.filter((entry) => entry.id !== item.id);
    total.value = Math.max(0, total.value - 1);
    if (!item.isRead) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
      syncUnread();
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '删除失败',
      icon: 'none',
    });
  }
}

async function clearAll(): Promise<void> {
  if (clearing.value || items.value.length === 0) {
    return;
  }

  const confirmed = await confirmDialog('清空全部消息', '所有消息都会被删除');
  if (!confirmed) {
    return;
  }

  clearing.value = true;
  try {
    await clearForumNotifications();
    items.value = [];
    total.value = 0;
    unreadCount.value = 0;
    syncUnread();
    uni.showToast({ title: '已清空消息', icon: 'none' });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '清空失败',
      icon: 'none',
    });
  } finally {
    clearing.value = false;
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadNotifications();
  }
}

function goBack(): void {
  uni.navigateBack();
}

onLoad(() => {
  void Promise.all([loadNotifications(true), loadUnread()]);
  setupSocket();
});

onUnload(() => {
  socketHandle?.close();
  socketHandle = null;
});
</script>

<template>
  <view class="notice-page rococo-canvas">
    <view class="notice-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">消息通知</text>
      <button v-if="unreadCount > 0" class="nav-action" @tap="markAllRead">全部已读</button>
    </view>

    <scroll-view class="notice-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && items.length === 0" class="notice-state">正在加载消息</view>
      <view v-else-if="items.length === 0" class="notice-state">暂无消息通知</view>

      <view v-else class="notice-list">
        <view
          v-for="item in items"
          :key="item.id"
          class="notice-card"
          :class="{ 'notice-card--unread': !item.isRead }"
          @tap="openNotification(item)"
        >
          <view class="notice-avatar">
            <image
              v-if="actorAvatar(item)"
              class="notice-avatar-image"
              :src="actorAvatar(item)"
              mode="aspectFill"
            />
            <text v-else class="notice-avatar-text">{{ actorInitial(item) }}</text>
          </view>

          <view class="notice-main">
            <view class="notice-top">
              <text class="notice-message">{{ item.message }}</text>
              <text v-if="!item.isRead" class="notice-dot"></text>
            </view>
            <text class="notice-dynamic">{{ dynamicTitle(item) }}</text>
            <view class="notice-foot">
              <text class="notice-type">{{ typeLabels[item.type] }}</text>
              <text class="notice-time">{{ formatTime(item.createdAt) }}</text>
            </view>
          </view>

          <button class="notice-delete" @tap.stop="removeNotification(item)">
            <app-icon name="trash" :size="26" color="#c76f96" />
          </button>
        </view>
      </view>

      <view v-if="loading && items.length > 0" class="notice-state">正在加载</view>
      <view v-else-if="!hasMore && items.length > 0" class="notice-state">已经到底了</view>

      <button
        v-if="items.length > 0"
        class="notice-clear"
        :disabled="clearing"
        @tap="clearAll"
      >
        清空全部消息
      </button>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.notice-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.notice-nav {
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

.nav-action {
  flex: none;
  height: 56rpx;
  padding: 0 20rpx;
  color: $rococo-rose;
  font-size: 22rpx;
  line-height: 54rpx;
  background: rgba($rococo-paper, 0.8);
  border: 1rpx solid rgba($rococo-rose, 0.3);
  border-radius: 28rpx;
}

.notice-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.notice-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.notice-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.notice-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  margin-bottom: 18rpx;
  padding: 22rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.2);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9),
    0 10rpx 24rpx rgba(137, 91, 116, 0.07);
}

.notice-card--unread {
  background: linear-gradient(135deg, rgba($rococo-pink-light, 0.34), rgba($rococo-paper, 0.96));
  border-color: rgba($rococo-rose, 0.26);
}

.notice-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 28rpx;
  font-weight: 600;
  background: $rococo-blush;
  border-radius: 50%;
}

.notice-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.notice-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.notice-top {
  display: flex;
  align-items: center;
  min-width: 0;
}

.notice-message {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-dot {
  flex: none;
  width: 12rpx;
  height: 12rpx;
  margin-left: 10rpx;
  background: $rococo-rose;
  border-radius: 50%;
}

.notice-dynamic {
  margin-top: 8rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.notice-type {
  padding: 2rpx 12rpx;
  color: $rococo-gold-rich;
  font-size: 19rpx;
  background: rgba($rococo-gold-pale, 0.4);
  border-radius: 16rpx;
}

.notice-time {
  color: $rococo-muted;
  font-size: 20rpx;
}

.notice-delete {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  margin-left: 10rpx;
  padding: 0;
  line-height: 1;
  background: rgba($rococo-paper, 0.9);
  border: 1rpx solid rgba($rococo-rose, 0.24);
  border-radius: 8rpx;
}

.notice-clear {
  width: 100%;
  height: 80rpx;
  margin-top: 10rpx;
  color: $rococo-rose;
  font-size: 24rpx;
  line-height: 78rpx;
  background: rgba($rococo-paper, 0.76);
  border: 1rpx solid rgba($rococo-rose, 0.28);
  border-radius: 8rpx;
}

.notice-clear[disabled] {
  opacity: 0.5;
}
</style>
