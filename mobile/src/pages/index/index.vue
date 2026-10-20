<script setup lang="ts">
import { ref } from 'vue';

import AiChatPanel from '@/components/AiChatPanel.vue';
import AppTabBar from '@/components/AppTabBar.vue';
import ChatPanel from '@/components/ChatPanel.vue';
import FriendsPanel from '@/components/FriendsPanel.vue';
import HomeFeed from '@/components/HomeFeed.vue';
import ProfilePanel from '@/components/ProfilePanel.vue';
import type { TabItem } from '@/components/types';

const activeTab = ref<TabItem['key']>('home');
const resetTokens = ref<Record<TabItem['key'], number>>({
  ai: 0,
  home: 0,
  chat: 0,
  friends: 0,
  profile: 0,
});
const tabs: TabItem[] = [
  {
    key: 'ai',
    label: 'AI',
    icon: '/static/navtab/ai.png',
    activeIcon: '/static/navtab/ai-active.png',
  },
  {
    key: 'home',
    label: '动态',
    icon: '/static/navtab/home.png',
    activeIcon: '/static/navtab/home-active.png',
  },
  {
    key: 'chat',
    label: '聊天',
    icon: '/static/navtab/msg.png',
    activeIcon: '/static/navtab/msg-active.png',
  },
  {
    key: 'friends',
    label: '好友',
    icon: '/static/navtab/friend.png',
    activeIcon: '/static/navtab/friend-active.png',
  },
  {
    key: 'profile',
    label: '我的',
    icon: '/static/navtab/my.png',
    activeIcon: '/static/navtab/my-active.png',
  },
];

function changeTab(key: string): void {
  const next = key as TabItem['key'];
  if (next === activeTab.value) {
    resetTokens.value[next] += 1;
    return;
  }
  activeTab.value = next;
}
</script>

<template>
  <view class="app-shell">
    <view class="shell-main">
      <AiChatPanel v-show="activeTab === 'ai'" />
      <HomeFeed v-show="activeTab === 'home'" :reset-token="resetTokens.home" />
      <ChatPanel
        v-show="activeTab === 'chat'"
        :reset-token="resetTokens.chat"
        @friends="changeTab('friends')"
      />
      <FriendsPanel v-show="activeTab === 'friends'" :reset-token="resetTokens.friends" />
      <ProfilePanel v-show="activeTab === 'profile'" @chat="changeTab('ai')" />
    </view>
    <AppTabBar :active="activeTab" :items="tabs" @change="changeTab" />
  </view>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba($rococo-blush, 0.32), transparent 240rpx),
    $rococo-ivory;
}

.shell-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
