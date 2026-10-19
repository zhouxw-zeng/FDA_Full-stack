<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({ name: 'FriendsPanel' });

const emit = defineEmits<{ browse: [] }>();

interface FriendItem {
  id: string;
  nickname: string;
  avatar: string;
  signature: string;
}

const keyword = ref('');
const friends = ref<FriendItem[]>([]);

const filteredFriends = computed(() => {
  const key = keyword.value.trim();
  if (!key) {
    return friends.value;
  }
  return friends.value.filter((friend) => friend.nickname.includes(key));
});

function addFriend(): void {
  uni.showToast({ title: '好友添加功能预留中', icon: 'none' });
}

function browseFeed(): void {
  emit('browse');
}
</script>

<template>
  <view class="friends-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Amis</text>
        <view class="title-row">
          <text class="page-title">好友</text>
          <text class="friend-count">{{ friends.length }} 位好友</text>
        </view>
      </view>
    </view>

    <view class="friends-toolbar">
      <view class="search-box">
        <app-icon name="search" :size="28" color="#7e6c75" />
        <input v-model="keyword" class="search-input" placeholder="搜索好友昵称" />
      </view>
      <button class="add-button" @tap="addFriend">
        <app-icon name="plus" :size="26" color="#c76f96" />
      </button>
    </view>

    <scroll-view class="friends-scroll" scroll-y :show-scrollbar="false">
      <view v-if="filteredFriends.length === 0" class="friends-empty">
        <view class="empty-mark">
          <app-icon name="user" :size="56" color="#c76f96" />
        </view>
        <text class="empty-title">还没有好友</text>
        <text class="empty-copy">去动态里发现同好，关注后就能在这里找到对方。</text>
        <button class="empty-button" @tap="browseFeed">去逛逛动态</button>
      </view>

      <view v-else class="friends-list">
        <view v-for="friend in filteredFriends" :key="friend.id" class="friend-card">
          <view class="friend-avatar">
            <image
              v-if="friend.avatar"
              class="friend-avatar-image"
              :src="friend.avatar"
              mode="aspectFill"
            />
            <text v-else>{{ friend.nickname.slice(0, 1) }}</text>
          </view>
          <view class="friend-main">
            <text class="friend-name">{{ friend.nickname }}</text>
            <text class="friend-signature">{{ friend.signature || '这个人很神秘' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.friends-panel {
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
  padding: 28rpx 32rpx 18rpx;
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

.friend-count {
  margin-left: 12rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.friends-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  padding: 0 32rpx 16rpx;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  height: 76rpx;
  padding: 0 20rpx;
  background: $rococo-paper;
  border: 1rpx solid $rococo-line;
  border-radius: 38rpx;
  box-sizing: border-box;
}

.search-input {
  flex: 1;
  min-width: 0;
  margin-left: 12rpx;
  color: $rococo-ink;
  font-size: 25rpx;
}

.add-button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  margin-left: 14rpx;
  padding: 0;
  line-height: 1;
  background: rgba($rococo-pink-light, 0.44);
  border: 1rpx solid rgba($rococo-rose, 0.34);
  border-radius: 50%;
}

.friends-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 0 32rpx 32rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.friends-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.friends-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.friends-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80rpx;
  padding: 56rpx 40rpx;
  background: rgba($rococo-paper, 0.9);
  border: 1rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 8rpx;
  box-sizing: border-box;
}

.empty-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 132rpx;
  height: 132rpx;
  background: linear-gradient(140deg, rgba($rococo-pink-light, 0.72), rgba($rococo-pink-blue, 0.6));
  border: 1rpx solid rgba($rococo-gold-rich, 0.26);
  border-radius: 50%;
}

.empty-title {
  margin-top: 26rpx;
  color: $rococo-ink;
  font-size: 30rpx;
  font-weight: 600;
}

.empty-copy {
  margin-top: 12rpx;
  color: $rococo-muted;
  font-size: 23rpx;
  line-height: 1.6;
  text-align: center;
}

.empty-button {
  min-width: 220rpx;
  height: 72rpx;
  margin-top: 28rpx;
  padding: 0 30rpx;
  color: #fffdfa;
  font-size: 25rpx;
  line-height: 70rpx;
  background: $rococo-rose;
  border-radius: 36rpx;
}

.friend-card {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 22rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.2);
  border-radius: 8rpx;
  box-sizing: border-box;
}

.friend-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 30rpx;
  font-weight: 600;
  background: $rococo-blush;
  border-radius: 20rpx;
}

.friend-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.friend-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.friend-name {
  color: $rococo-ink;
  font-size: 27rpx;
  font-weight: 600;
}

.friend-signature {
  margin-top: 6rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
