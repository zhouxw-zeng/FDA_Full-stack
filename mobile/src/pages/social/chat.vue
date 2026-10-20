<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { connectImSocket, type ImSocketHandle } from '@/api/im-socket';
import { fetchSocialMessages, fetchSocialUser, sendSocialMessage } from '@/api/social';
import { useUserStore } from '@/stores/user';
import type { SocialMessage, SocialUserDetail } from '@/types';

defineOptions({ name: 'SocialChat' });

const userStore = useUserStore();

const peerId = ref('');
const peerName = ref('聊天');
const peer = ref<SocialUserDetail | null>(null);
const messages = ref<SocialMessage[]>([]);
const input = ref('');
const loading = ref(true);
const sending = ref(false);
const scrollIntoView = ref('');

let socketHandle: ImSocketHandle | null = null;

const myId = computed(() => userStore.user?.id || '');
const canSend = computed(() => input.value.trim().length > 0 && !sending.value);
const peerAvatar = computed(() => resolveFileUrl(peer.value?.avatar));
const myAvatar = computed(() => resolveFileUrl(userStore.user?.avatar));

function scrollToBottom(): void {
  void nextTick(() => {
    scrollIntoView.value = `message-${messages.value.length - 1}`;
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isMine(message: SocialMessage): boolean {
  return message.senderId === myId.value;
}

function appendMessage(message: SocialMessage): void {
  if (messages.value.some((item) => item.id === message.id)) {
    return;
  }
  messages.value.push(message);
  scrollToBottom();
}

async function loadChat(): Promise<void> {
  if (!peerId.value) {
    uni.showToast({ title: '缺少聊天对象', icon: 'none' });
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const [history, user] = await Promise.all([
      fetchSocialMessages(peerId.value, 1, 50),
      fetchSocialUser(peerId.value),
    ]);
    messages.value = history.list;
    peer.value = user;
    peerName.value = user.nickname;
    scrollToBottom();
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载聊天失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function handleIncoming(message: SocialMessage): void {
  const incomingFromPeer =
    message.senderId === peerId.value && message.recipientId === myId.value;
  const echoOfMine =
    message.senderId === myId.value && message.recipientId === peerId.value;
  if (incomingFromPeer || echoOfMine) {
    appendMessage(message);
  }
}

function createRequestId(): string {
  return `im-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function send(): Promise<void> {
  const content = input.value.trim();
  if (!content || sending.value || !peerId.value) {
    return;
  }

  sending.value = true;
  try {
    const message = await sendSocialMessage({
      recipientId: peerId.value,
      content,
      requestId: createRequestId(),
    });
    appendMessage(message);
    input.value = '';
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '发送失败',
      icon: 'none',
    });
  } finally {
    sending.value = false;
  }
}

function goBack(): void {
  uni.navigateBack();
}

onLoad((options) => {
  peerId.value = String(options?.userId || '');
  peerName.value = decodeURIComponent(String(options?.name || '聊天'));
  void loadChat();
  socketHandle = connectImSocket({
    onMessage: handleIncoming,
  });
});

onUnload(() => {
  socketHandle?.close();
  socketHandle = null;
});
</script>

<template>
  <view class="chat-page rococo-canvas">
    <view class="chat-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">{{ peerName }}</text>
    </view>

    <scroll-view
      class="message-scroll"
      scroll-y
      :show-scrollbar="false"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="loading" class="chat-state">正在加载聊天记录</view>
      <view v-else-if="messages.length === 0" class="chat-state">
        还没有消息，打个招呼吧
      </view>

      <view
        v-for="(message, index) in messages"
        :id="`message-${index}`"
        :key="message.id"
        class="message-row"
        :class="isMine(message) ? 'message-row--mine' : 'message-row--peer'"
      >
        <view v-if="!isMine(message)" class="message-avatar">
          <image
            v-if="peerAvatar"
            class="message-avatar-image"
            :src="peerAvatar"
            mode="aspectFill"
          />
          <text v-else>{{ peerName.slice(0, 1) }}</text>
        </view>

        <view class="message-main">
          <view class="message-bubble">{{ message.content }}</view>
          <text class="message-time">{{ formatTime(message.createdAt) }}</text>
        </view>

        <view v-if="isMine(message)" class="message-avatar message-avatar--mine">
          <image
            v-if="myAvatar"
            class="message-avatar-image"
            :src="myAvatar"
            mode="aspectFill"
          />
          <text v-else>我</text>
        </view>
      </view>
    </scroll-view>

    <view class="chat-composer">
      <textarea
        v-model="input"
        class="composer-input"
        :auto-height="true"
        :maxlength="2000"
        placeholder="输入消息"
      />
      <button class="send-button" :disabled="!canSend" @tap="send">
        {{ sending ? '发送中' : '发送' }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.chat-nav {
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

.message-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 28rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.message-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.message-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
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

.message-row {
  display: flex;
  align-items: flex-start;
  margin: 18rpx 0;
}

.message-row--mine {
  justify-content: flex-end;
}

.message-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 24rpx;
  font-weight: 600;
  background: $rococo-blush;
  border-radius: 50%;
}

.message-avatar--mine {
  background: rgba($rococo-pink-blue, 0.6);
}

.message-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.message-main {
  display: flex;
  flex-direction: column;
  max-width: 74%;
}

.message-row--peer .message-main {
  align-items: flex-start;
  margin-left: 14rpx;
}

.message-row--mine .message-main {
  align-items: flex-end;
  margin-right: 14rpx;
}

.message-bubble {
  padding: 20rpx 24rpx;
  color: $rococo-ink;
  font-size: 26rpx;
  line-height: 1.6;
  word-break: break-word;
  background: $rococo-paper;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
  box-shadow: 0 8rpx 20rpx rgba(94, 67, 60, 0.06);
}

.message-row--mine .message-bubble {
  color: #fffdfa;
  background: $rococo-rose;
  border-color: transparent;
}

.message-time {
  margin-top: 6rpx;
  color: $rococo-muted;
  font-size: 19rpx;
}

.chat-composer {
  display: flex;
  flex: none;
  align-items: center;
  padding: 18rpx 28rpx;
  padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $rococo-line;
  background: $rococo-paper;
}

.composer-input {
  flex: 1;
  min-width: 0;
  min-height: 74rpx;
  max-height: 220rpx;
  padding: 18rpx 22rpx;
  color: $rococo-ink;
  font-size: 26rpx;
  line-height: 1.45;
  background: $rococo-ivory;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
  box-sizing: border-box;
  overflow-y: auto;
  scrollbar-width: none;
}

.composer-input::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.send-button {
  flex: none;
  min-width: 104rpx;
  height: 74rpx;
  margin-left: 16rpx;
  padding: 0 22rpx;
  color: #fffdfa;
  font-size: 25rpx;
  line-height: 72rpx;
  background: $rococo-rose;
  border-radius: 8rpx;
}

.send-button[disabled] {
  color: rgba(255, 253, 250, 0.72);
  background: $rococo-gold-soft;
}
</style>
