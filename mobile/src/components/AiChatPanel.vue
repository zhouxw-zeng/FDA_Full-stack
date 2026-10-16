<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { fetchAiChatMessages, fetchAiChatSessions } from '@/api/ai';
import { streamAiChat } from '@/api/ai-socket';
import { resolveFileUrl } from '@/api/files';
import { useUserStore } from '@/stores/user';
import type { AiChatMessage, AiChatSession } from '@/types';

defineOptions({ name: 'AiChatPanel' });

interface LocalMessage extends AiChatMessage {
  local?: boolean;
}

const userStore = useUserStore();
const messages = ref<LocalMessage[]>([]);
const sessions = ref<AiChatSession[]>([]);
const sessionId = ref('');
const input = ref('');
const sending = ref(false);
const historyLoading = ref(false);
const sessionLoading = ref(false);
const historyVisible = ref(false);
const scrollIntoView = ref('');

const canSend = computed(() => Boolean(input.value.trim()) && !sending.value);
const waitingForAnswer = computed(
  () => sending.value && !messages.value[messages.value.length - 1]?.content,
);
const activeSessionTitle = computed(() => {
  if (!sessionId.value) {
    return '新会话';
  }
  return sessions.value.find((session) => session.id === sessionId.value)?.title || '历史会话';
});
const userAvatarUrl = computed(() => resolveFileUrl(userStore.user?.avatar));
const userAvatarText = computed(
  () => userStore.user?.nickname?.slice(0, 1) || userStore.user?.username?.slice(0, 1) || '我',
);

function ensureGreeting(): void {
  if (!userStore.isLoggedIn || messages.value.length > 0) {
    return;
  }

  messages.value.push({
    id: 'welcome',
    role: 'assistant',
    content: '你好，我是家庭动态助手AI中控。今天想从哪一处开始？',
    createdAt: new Date().toISOString(),
  });
}

function scrollToBottom(): void {
  void nextTick(() => {
    scrollIntoView.value = `message-${messages.value.length - 1}`;
  });
}

function formatSessionTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (sameDay) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function loadHistory(): Promise<void> {
  if (!userStore.isLoggedIn) {
    sessions.value = [];
    historyLoading.value = false;
    return;
  }

  historyLoading.value = true;
  try {
    const result = await fetchAiChatSessions(1, 20);
    sessions.value = result.list;
  } finally {
    historyLoading.value = false;
  }
}

async function openSession(session: AiChatSession): Promise<void> {
  if (sessionLoading.value) {
    return;
  }

  sessionLoading.value = true;
  historyVisible.value = false;
  try {
    const history = await fetchAiChatMessages(session.id);
    sessionId.value = session.id;
    messages.value = history;
    scrollToBottom();
  } finally {
    sessionLoading.value = false;
  }
}

async function toggleHistory(): Promise<void> {
  historyVisible.value = !historyVisible.value;
  if (historyVisible.value && sessions.value.length === 0) {
    await loadHistory();
  }
}

function startNewConversation(): void {
  messages.value = [];
  sessionId.value = '';
  historyVisible.value = false;
  ensureGreeting();
  scrollToBottom();
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
  const assistantMessage: LocalMessage = {
    id: `stream-${Date.now()}`,
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
    local: true,
  };
  messages.value.push(assistantMessage);
  scrollToBottom();

  try {
    await streamAiChat(
      {
        message: content,
        sessionId: sessionId.value || undefined,
      },
      {
        onStart: ({ sessionId: nextSessionId }) => {
          if (nextSessionId) {
            sessionId.value = nextSessionId;
          }
        },
        onDelta: ({ content: delta }) => {
          assistantMessage.content += delta;
          scrollToBottom();
        },
        onReply: ({ message }) => {
          assistantMessage.id = message.id;
          assistantMessage.content = message.content;
          assistantMessage.createdAt = message.createdAt;
        },
        onDone: ({ sessionId: nextSessionId }) => {
          sessionId.value = nextSessionId;
        },
      },
    );
    await loadHistory();
  } catch (error) {
    messages.value = messages.value.filter((message) => message.id !== assistantMessage.id);
    uni.showToast({
      title: error instanceof Error ? error.message : 'AI 问答失败',
      icon: 'none',
    });
  } finally {
    sending.value = false;
    scrollToBottom();
  }
}

function goLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

onMounted(() => {
  ensureGreeting();
  void loadHistory();
  scrollToBottom();
});

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      void loadHistory();
      ensureGreeting();
      scrollToBottom();
    } else {
      sessions.value = [];
      messages.value = [];
      sessionId.value = '';
      historyVisible.value = false;
    }
  },
);
</script>

<template>
  <view class="chat-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Console Centrale</text>
        <view class="title-row">
          <text class="page-title">AI 中控</text>
          <text class="session-title">{{ activeSessionTitle }}</text>
        </view>
      </view>
      <view class="header-actions">
        <button class="mini-button" @tap="toggleHistory">历史问答</button>
        <button class="mini-button" @tap="startNewConversation">新会话</button>
      </view>
    </view>

    <view v-if="historyVisible && userStore.isLoggedIn" class="history-panel">
      <view class="history-head">
        <text class="history-title">历史问答</text>
        <text class="history-close" @tap="toggleHistory">收起</text>
      </view>

      <scroll-view class="history-scroll" scroll-y>
        <view v-if="historyLoading" class="history-state">正在加载历史</view>
        <view v-else-if="sessions.length === 0" class="history-state">暂无历史会话</view>
        <view
          v-for="session in sessions"
          :key="session.id"
          class="history-item"
          :class="{ 'history-item--active': session.id === sessionId }"
          @tap="openSession(session)"
        >
          <view class="history-item-main">
            <text class="history-item-title">{{ session.title }}</text>
            <text class="history-item-time">{{ formatSessionTime(session.updatedAt) }}</text>
          </view>
          <app-icon name="forward" :size="28" color="#999999" />
        </view>
      </scroll-view>
    </view>

    <scroll-view
      v-if="userStore.isLoggedIn"
      class="chat-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="sessionLoading" class="typing-row">正在加载历史上下文</view>
      <view
        v-for="(message, index) in messages"
        :id="`message-${index}`"
        :key="message.id"
        class="message-row"
        :class="message.role === 'user' ? 'message-row--user' : 'message-row--assistant'"
      >
        <view v-if="message.role !== 'user'" class="message-avatar message-avatar--ai">
          <app-icon name="sparkles" :size="36" color="#ffffff" />
        </view>
        <view class="message-content">
          <view class="message-bubble">{{ message.content }}</view>
          <text class="message-time">{{ formatMessageTime(message.createdAt) }}</text>
        </view>
        <view v-if="message.role === 'user'" class="message-avatar message-avatar--user">
          <image
            v-if="userAvatarUrl"
            class="message-avatar-image"
            :src="userAvatarUrl"
            mode="aspectFill"
          />
          <text v-else>{{ userAvatarText }}</text>
        </view>
      </view>
      <view v-if="waitingForAnswer" class="typing-row">正在组织回答</view>
    </scroll-view>

    <view v-else class="guest-state rococo-panel">
      <text class="guest-title">登录后开始对话</text>
      <text class="guest-copy">AI 中控会读取你的历史上下文，并保留本轮讨论。</text>
      <button class="primary-button" @tap="goLogin">前往登录</button>
    </view>

    <view v-if="userStore.isLoggedIn" class="composer">
      <textarea
        v-model="input"
        class="composer-input"
        :auto-height="true"
        placeholder="输入问题"
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

.session-title {
  min-width: 0;
  margin-left: 12rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  flex: none;
  margin-left: 12rpx;
}

.mini-button {
  min-width: 112rpx;
  height: 58rpx;
  margin-left: 10rpx;
  padding: 0 16rpx;
  color: $rococo-rose;
  font-size: 21rpx;
  line-height: 56rpx;
  background: $rococo-paper;
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
}

.history-panel {
  flex: none;
  margin: 0 28rpx 16rpx;
  padding: 22rpx;
  background: $rococo-paper;
  border: 1rpx solid $rococo-line;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 32rpx rgba(137, 91, 116, 0.08);
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.history-title {
  color: $rococo-ink;
  font-size: 27rpx;
  font-weight: 600;
}

.history-close {
  color: $rococo-rose;
  font-size: 22rpx;
}

.history-scroll {
  max-height: 420rpx;
}

.history-state {
  padding: 28rpx 0;
  color: $rococo-muted;
  font-size: 23rpx;
  text-align: center;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 86rpx;
  padding: 12rpx 14rpx;
  border-bottom: 1rpx solid $rococo-line;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item--active {
  background: rgba($rococo-blush, 0.3);
  border-radius: 8rpx;
}

.history-item-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.history-item-title {
  overflow: hidden;
  color: $rococo-ink;
  font-size: 25rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-time {
  margin-top: 5rpx;
  color: $rococo-muted;
  font-size: 21rpx;
}

.chat-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 0 28rpx;
  box-sizing: border-box;
}

.message-row {
  display: flex;
  align-items: flex-start;
  margin: 18rpx 0;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  overflow: hidden;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
  border-radius: 50%;
}

.message-avatar--ai {
  background: linear-gradient(135deg, $rococo-rose, $rococo-bright-blue);
}

.message-avatar--user {
  background: $rococo-blush;
}

.message-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 78%;
}

.message-row--user .message-content {
  align-items: flex-end;
}

.message-row--assistant .message-content {
  align-items: flex-start;
  margin-left: 14rpx;
}

.message-row--user .message-content {
  margin-right: 14rpx;
}

.message-bubble {
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

.message-time {
  margin-top: 8rpx;
  color: $rococo-muted;
  font-size: 19rpx;
  line-height: 1.3;
}

.typing-row {
  margin: 18rpx 0;
  color: $rococo-muted;
  font-size: 22rpx;
}

.composer {
  display: flex;
  flex: none;
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

.composer-input::-webkit-scrollbar,
.chat-scroll::-webkit-scrollbar {
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
  color: #fff;
  font-size: 25rpx;
  line-height: 72rpx;
  background: $rococo-rose;
  border-radius: 8rpx;
}

.send-button[disabled] {
  color: rgba(255, 255, 255, 0.72);
  background: $rococo-gold-soft;
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
