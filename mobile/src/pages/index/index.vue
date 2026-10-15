<script setup lang="ts">
import { ref } from 'vue';

import AiChatPanel from '@/components/AiChatPanel.vue';
import AppTabBar from '@/components/AppTabBar.vue';
import HomeFeed from '@/components/HomeFeed.vue';
import ProfilePanel from '@/components/ProfilePanel.vue';
import type { TabItem } from '@/components/types';

const activeTab = ref<TabItem['key']>('home');
const tabs: TabItem[] = [
  {
    key: 'home',
    label: '首页',
    icon: '/static/navtab/home.png',
    activeIcon: '/static/navtab/home-active.png',
  },
  {
    key: 'ai',
    label: 'AI中控',
    icon: '/static/navtab/ai.png',
    activeIcon: '/static/navtab/ai-active.png',
  },
  {
    key: 'profile',
    label: '我的',
    icon: '/static/navtab/my.png',
    activeIcon: '/static/navtab/my-active.png',
  },
];

function changeTab(key: string): void {
  activeTab.value = key as TabItem['key'];
}
</script>

<template>
  <view class="app-shell">
    <view class="shell-main">
      <HomeFeed v-show="activeTab === 'home'" />
      <AiChatPanel v-show="activeTab === 'ai'" />
      <ProfilePanel v-show="activeTab === 'profile'" />
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
