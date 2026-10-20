<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import {
  deleteSocialConversation,
  fetchSocialConversations,
  pinSocialConversation,
} from '@/api/social';
import { usePullRefresh } from '@/composables/usePullRefresh';
import type { SocialConversation } from '@/types';
import SwipeAction from '@/components/SwipeAction.vue';

defineOptions({ name: 'ChatPanel' });

const props = withDefaults(
  defineProps<{
    resetToken?: number;
  }>(),
  {
    resetToken: 0,
  },
);

const emit = defineEmits<{ friends: [] }>();

const conversations = ref<SocialConversation[]>([]);
const total = ref(0);
const page = ref(1);
const size = 15;
const loading = ref(false);
const operatingId = ref('');
const openedConversationId = ref('');
const hasMore = computed(() => conversations.value.length < total.value);

function avatarUrl(conversation: SocialConversation): string {
  return resolveFileUrl(conversation.user.avatar);
}

function formatTime(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
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
  return `${month}-${day}`;
}

function lastMessageText(conversation: SocialConversation): string {
  return conversation.lastMessage?.content || '开始聊天吧';
}

async function loadConversations(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchSocialConversations(page.value, size);
    conversations.value = reset ? result.list : [...conversations.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载会话失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

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
  onRefresh: () => loadConversations(true),
});

function loadMore(): void {
  if (hasMore.value) {
    void loadConversations();
  }
}

function openConversation(conversation: SocialConversation): void {
  openedConversationId.value = '';
  uni.navigateTo({
    url: `/pages/social/chat?id=${encodeURIComponent(conversation.id)}&userId=${encodeURIComponent(
      conversation.user.id,
    )}&name=${encodeURIComponent(conversation.user.nickname)}`,
  });
}

function handleSwipeOpen(conversationId: string): void {
  openedConversationId.value = conversationId;
}

function handleSwipeClose(conversationId: string): void {
  if (openedConversationId.value === conversationId) {
    openedConversationId.value = '';
  }
}

async function togglePin(conversation: SocialConversation): Promise<void> {
  if (operatingId.value) {
    return;
  }

  operatingId.value = conversation.id;
  openedConversationId.value = '';
  try {
    await pinSocialConversation(conversation.id, !conversation.isPinned);
    uni.showToast({
      title: conversation.isPinned ? '已取消置顶' : '已置顶',
      icon: 'none',
    });
    await loadConversations(true);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  } finally {
    operatingId.value = '';
  }
}

function confirmDeleteConversation(conversation: SocialConversation): void {
  if (operatingId.value) {
    return;
  }

  uni.showModal({
    title: '删除会话',
    content: `确定从聊天列表删除与「${conversation.user.nickname}」的会话吗？`,
    confirmColor: '#c76f96',
    success: ({ confirm }) => {
      if (!confirm) {
        return;
      }

      void (async () => {
        operatingId.value = conversation.id;
        try {
          await deleteSocialConversation(conversation.id);
          openedConversationId.value = '';
          conversations.value = conversations.value.filter((item) => item.id !== conversation.id);
          total.value = Math.max(0, total.value - 1);
          uni.showToast({ title: '会话已删除', icon: 'none' });
        } catch (error) {
          uni.showToast({
            title: error instanceof Error ? error.message : '删除失败',
            icon: 'none',
          });
        } finally {
          operatingId.value = '';
        }
      })();
    },
  });
}

function goFriends(): void {
  emit('friends');
}

onShow(() => {
  void loadConversations(true);
});

watch(
  () => props.resetToken,
  () => {
    void reset();
  },
);
</script>

<template>
  <view class="chat-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Chat</text>
        <view class="title-row">
          <text class="page-title">聊天</text>
          <text class="chat-status">{{ total }} 个会话</text>
        </view>
      </view>
    </view>

    <scroll-view
      class="chat-scroll"
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

      <view v-if="loading && conversations.length === 0" class="chat-state">正在加载会话</view>

      <view v-else-if="conversations.length === 0" class="chat-placeholder">
        <view class="placeholder-mark">
          <app-icon name="comment" :size="56" color="#c76f96" />
        </view>
        <text class="placeholder-title">还没有聊天</text>
        <text class="placeholder-copy">在好友列表选择好友，点击聊天即可开始会话。</text>
        <button class="placeholder-button" @tap="goFriends">去好友列表</button>
      </view>

      <view v-else class="conversation-list">
        <view
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversation-swipe-row"
        >
          <SwipeAction
            :opened="openedConversationId === conversation.id"
            @open="handleSwipeOpen(conversation.id)"
            @close="handleSwipeClose(conversation.id)"
            @select="openConversation(conversation)"
          >
            <template #actions>
              <button
                class="swipe-action-button swipe-action-button--pin"
                :disabled="operatingId === conversation.id"
                @tap.stop="togglePin(conversation)"
              >
                <app-icon name="arrowUp" :size="30" color="#fffdfa" />
                <text>{{ conversation.isPinned ? '取消置顶' : '置顶' }}</text>
              </button>
              <button
                class="swipe-action-button swipe-action-button--delete"
                :disabled="operatingId === conversation.id"
                @tap.stop="confirmDeleteConversation(conversation)"
              >
                <app-icon name="trash" :size="30" color="#fffdfa" />
                <text>删除</text>
              </button>
            </template>

            <view
              class="conversation-card"
              :class="{ 'conversation-card--pinned': conversation.isPinned }"
            >
              <view class="conversation-avatar">
                <image
                  v-if="avatarUrl(conversation)"
                  class="conversation-avatar-image"
                  :src="avatarUrl(conversation)"
                  mode="aspectFill"
                />
                <text v-else>{{ conversation.user.nickname.slice(0, 1) }}</text>
              </view>

              <view class="conversation-main">
                <view class="conversation-row">
                  <text class="conversation-name">{{ conversation.user.nickname }}</text>
                  <text v-if="conversation.isPinned" class="conversation-pin-tag">置顶</text>
                  <text class="conversation-time">
                    {{ formatTime(conversation.lastMessageAt) }}
                  </text>
                </view>
                <view class="conversation-row conversation-row--bottom">
                  <text class="conversation-preview">{{ lastMessageText(conversation) }}</text>
                  <text v-if="conversation.unreadCount > 0" class="conversation-unread">
                    {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                  </text>
                </view>
              </view>
            </view>
          </SwipeAction>
        </view>
      </view>

      <view v-if="loading && conversations.length > 0" class="chat-state">正在加载</view>
      <view v-else-if="!hasMore && conversations.length > 0" class="chat-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
}

.header-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.eyebrow {
  color: $rococo-gold;
  font-size: 20rpx;
  line-height: 1.4;
  text-transform: uppercase;
}

.title-row {
  display: flex;
  align-items: baseline;
  min-width: 0;
  margin-top: 4rpx;
}

.page-title {
  flex: none;
  color: $rococo-ink;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.chat-status {
  margin-left: 12rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.chat-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 0 28rpx 24rpx;
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
.chat-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.chat-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 60rpx 4rpx 0;
  padding: 64rpx 40rpx;
  background: rgba($rococo-paper, 0.92);
  border: 1rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 16rpx 40rpx rgba(137, 91, 116, 0.08);
}

.placeholder-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(140deg, rgba($rococo-pink-light, 0.72), rgba($rococo-pink-blue, 0.6));
  border: 1rpx solid rgba($rococo-gold-rich, 0.26);
  border-radius: 50%;
}

.placeholder-title {
  margin-top: 28rpx;
  color: $rococo-ink;
  font-size: 32rpx;
  font-weight: 600;
}

.placeholder-copy {
  margin-top: 12rpx;
  color: $rococo-muted;
  font-size: 24rpx;
  line-height: 1.6;
  text-align: center;
}

.placeholder-button {
  min-width: 240rpx;
  height: 76rpx;
  margin-top: 32rpx;
  padding: 0 32rpx;
  color: #fffdfa;
  font-size: 26rpx;
  line-height: 74rpx;
  background: $rococo-rose;
  border-radius: 38rpx;
}

.conversation-card {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  padding: 20rpx 24rpx;
  background: rgba($rococo-stucco, 0.72);
  border-radius: 20rpx;
  box-sizing: border-box;
}

.conversation-card--pinned {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(126deg, rgba($rococo-gold-pale, 0.42), transparent 44%),
    linear-gradient(302deg, rgba($rococo-pink-light, 0.4), transparent 48%),
    rgba($rococo-cream, 0.94);
  border: 1rpx solid rgba($rococo-gold-rich, 0.36);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 8rpx 22rpx rgba($rococo-gold-rich, 0.12);
}

.conversation-card--pinned::before,
.conversation-card--pinned::after {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  content: '';
}

.conversation-card--pinned::before {
  top: -48rpx;
  right: -32rpx;
  width: 124rpx;
  height: 124rpx;
  border: 1rpx solid rgba($rococo-gold-rich, 0.22);
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(18deg);
}

.conversation-card--pinned::after {
  bottom: -56rpx;
  left: -36rpx;
  width: 132rpx;
  height: 132rpx;
  border: 1rpx solid rgba($rococo-pink-blue, 0.28);
  border-top-color: transparent;
  border-right-color: transparent;
  transform: rotate(-12deg);
}

.conversation-card--pinned .conversation-avatar,
.conversation-card--pinned .conversation-main {
  position: relative;
  z-index: 1;
}

.conversation-swipe-row {
  margin-bottom: 16rpx;
}

.swipe-action-button {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 8rpx;
  height: 100%;
  color: #fffdfa;
  font-family: Georgia, 'Songti SC', serif;
  font-size: 22rpx;
  line-height: 1.2;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 253, 250, 0.34),
    inset 0 -8rpx 18rpx rgba(73, 57, 68, 0.08);
  box-sizing: border-box;
}

.swipe-action-button--pin {
  background:
    repeating-linear-gradient(135deg, rgba(255, 253, 250, 0.08) 0 1rpx, transparent 1rpx 8rpx),
    linear-gradient(145deg, #d9bd83, #b88a45 62%, #9f7133);
  border-right: 1rpx solid rgba(255, 253, 250, 0.3);
}

.swipe-action-button--delete {
  background:
    repeating-linear-gradient(135deg, rgba(255, 253, 250, 0.08) 0 1rpx, transparent 1rpx 8rpx),
    linear-gradient(145deg, #d88aa8, #c76f96 62%, #a95478);
}

.swipe-action-button[disabled] {
  opacity: 0.55;
}

.conversation-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 32rpx;
  font-weight: 600;
  background: $rococo-blush;
  border-radius: 50%;
}

.conversation-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.conversation-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 20rpx;
}

.conversation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.conversation-row--bottom {
  margin-top: 8rpx;
}

.conversation-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 30rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  flex: none;
  margin-left: 12rpx;
  color: rgba($rococo-muted, 0.66);
  font-size: 22rpx;
}

.conversation-pin-tag {
  flex: none;
  margin-left: 10rpx;
  padding: 3rpx 10rpx;
  color: $rococo-gold-rich;
  font-size: 19rpx;
  line-height: 1.4;
  background: linear-gradient(
    135deg,
    rgba($rococo-gold-pale, 0.76),
    rgba($rococo-cream, 0.92)
  );
  border: 1rpx solid rgba($rococo-gold-rich, 0.36);
  border-radius: 8rpx;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.86),
    0 2rpx 6rpx rgba($rococo-gold-rich, 0.12);
}

.conversation-preview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 25rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-unread {
  flex: none;
  min-width: 34rpx;
  height: 34rpx;
  margin-left: 12rpx;
  padding: 0 8rpx;
  color: #fffdfa;
  font-size: 20rpx;
  line-height: 34rpx;
  text-align: center;
  background: #b9b3b0;
  border-radius: 17rpx;
  box-sizing: border-box;
}
</style>
