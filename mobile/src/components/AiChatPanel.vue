<script setup lang="ts">
defineOptions({ name: 'AiChatPanel' });

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { sendChatMessage } from '@/api/ai';
import { useUserStore } from '@/stores/user';
import type { AiChatMessage } from '@/types';

interface LocalMessage extends AiChatMessage {
  local?: boolean;
}

const userStore = useUserStore();
const messages = ref<LocalMessage[]>([]);
const sessionId = ref('');
const input = ref('');
const sending = ref(false);
const scrollIntoView = ref('');

const canSend = computed(() => Boolean(input.value.trim()) && !sending.value);

function ensureGreeting(): void {
  if (!userStore.isLoggedIn || messages.value.length > 0) {
    return;
  }

  messages.value.push({
    id: 'welcome',
    role: 'assistant',
    content: '你好，我是洛可可AI中控。今天想从哪一处开始？',
    createdAt: new Date().toISOString(),
  });
}

function scrollToBottom(): void {
  void nextTick(() => {
    scrollIntoView.value = `message-${messages.value.length - 1}`;
  });
}

async function send(): Promise<void> {
  const content = input.value.trim();
  if (!content || sending.value || !userStore.isLoggedIn) {
    return;
  }

  messages.value.push({
    id: `local-${Date.now()}`,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
    local: true,
  });
  input.value = '';
  sending.value = true;
  scrollToBottom();

  try {
    const result = await sendChatMessage({
      message: content,
      sessionId: sessionId.value || undefined,
    });
    sessionId.value = result.sessionId;
    messages.value.push(result.message);
  } finally {
    sending.value = false;
    scrollToBottom();
  }
}

function clearConversation(): void {
  messages.value = [];
  sessionId.value = '';
  ensureGreeting();
  scrollToBottom();
}

function goLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

onMounted(() => {
  ensureGreeting();
  scrollToBottom();
});

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      ensureGreeting();
      scrollToBottom();
    }
  },
);
</script>

<template>
  <view class="chat-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Console Centrale</text>
        <text class="page-title">AI 中控</text>
      </view>
      <button v-if="userStore.isLoggedIn" class="mini-button" @tap="clearConversation">
        新会话
      </button>
    </view>

    <scroll-view
      v-if="userStore.isLoggedIn"
      class="chat-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view
        v-for="(message, index) in messages"
        :id="`message-${index}`"
        :key="message.id"
        class="message-row"
        :class="message.role === 'user' ? 'message-row--user' : 'message-row--assistant'"
      >
        <view class="message-bubble">{{ message.content }}</view>
      </view>
      <view v-if="sending" class="typing-row">正在组织回答</view>
    </scroll-view>

    <view v-else class="guest-state rococo-panel">
      <text class="guest-title">登录后开始对话</text>
      <text class="guest-copy">AI 中控会读取你的会话上下文，并保留本轮讨论。</text>
      <button class="primary-button" @tap="goLogin">前往登录</button>
    </view>

    <view v-if="userStore.isLoggedIn" class="composer">
      <input
        v-model="input"
        class="composer-input"
        confirm-type="send"
        placeholder="输入问题"
        @confirm="send"
      />
      <button class="send-button" :disabled="!canSend" @tap="send">发送</button>
    </view>
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

.chat-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 28rpx;
  box-sizing: border-box;
}

.message-row {
  display: flex;
  margin: 18rpx 0;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 78%;
  padding: 22rpx 24rpx;
  font-size: 27rpx;
  line-height: 1.65;
  word-break: break-word;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
  box-shadow: 0 8rpx 24rpx rgba(94, 67, 60, 0.06);
}

.message-row--user .message-bubble {
  color: #fff;
  background: $rococo-rose;
  border-color: transparent;
}

.message-row--assistant .message-bubble {
  color: $rococo-ink;
  background: $rococo-paper;
}

.typing-row {
  margin: 18rpx 0;
  color: $rococo-muted;
  font-size: 22rpx;
}

.composer {
  display: flex;
  flex: none;
  gap: 16rpx;
  align-items: center;
  padding: 18rpx 28rpx;
  padding-bottom: calc(18rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $rococo-line;
  background: $rococo-paper;
}

.composer-input {
  flex: 1;
  min-width: 0;
  height: 74rpx;
  padding: 0 22rpx;
  color: $rococo-ink;
  font-size: 26rpx;
  background: $rococo-ivory;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
}

.send-button {
  flex: none;
  min-width: 104rpx;
  height: 74rpx;
  padding: 0 22rpx;
  color: #fff;
  font-size: 25rpx;
  line-height: 72rpx;
  background: $rococo-rose;
  border: none;
  border-radius: 8rpx;
}

.send-button[disabled] {
  color: rgba(255, 255, 255, 0.72);
  background: $rococo-gold-soft;
}

.guest-state {
  flex: none;
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
