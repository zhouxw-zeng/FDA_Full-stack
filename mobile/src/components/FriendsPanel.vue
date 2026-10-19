<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchSocialFriends, followSocialUser, unfollowSocialUser } from '@/api/social';
import type { SocialFollowState, SocialUser } from '@/types';

defineOptions({ name: 'FriendsPanel' });

const friends = ref<SocialUser[]>([]);
const total = ref(0);
const page = ref(1);
const size = 15;
const loading = ref(false);
const actingId = ref('');
const hasMore = computed(() => friends.value.length < total.value);

function avatarUrl(user: SocialUser): string {
  return resolveFileUrl(user.avatar);
}

async function loadFriends(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await fetchSocialFriends(page.value, size);
    friends.value = reset ? result.list : [...friends.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载好友失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function applyFollowState(targetUserId: string, state: SocialFollowState): void {
  const previousCount = friends.value.length;
  friends.value = friends.value
    .map((user) =>
      user.id === targetUserId
        ? {
            ...user,
            isFollowing: state.isFollowing,
            isFollowedBy: state.isFollowedBy,
            isMutual: state.isMutual,
            canChat: state.canChat,
          }
        : user,
    )
    .filter((user) => user.isMutual);
  total.value = Math.max(0, total.value - (previousCount - friends.value.length));
}

async function toggleFollow(user: SocialUser): Promise<void> {
  if (actingId.value) {
    return;
  }

  const wasFollowing = user.isFollowing;
  actingId.value = user.id;
  try {
    const state = wasFollowing
      ? await unfollowSocialUser(user.id)
      : await followSocialUser(user.id);
    applyFollowState(user.id, state);
    uni.showToast({ title: wasFollowing ? '已取消关注' : '已关注', icon: 'none' });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  } finally {
    actingId.value = '';
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadFriends();
  }
}

function addFriend(): void {
  uni.navigateTo({ url: '/pages/social/search' });
}

onShow(() => {
  void loadFriends(true);
});
</script>

<template>
  <view class="friends-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Amis</text>
        <view class="title-row">
          <text class="page-title">好友</text>
          <text class="friend-count">{{ total }} 位好友</text>
        </view>
      </view>
      <button class="add-button" @tap="addFriend">
        <app-icon name="plus" :size="26" color="#c76f96" />
        <text class="add-text">添加好友</text>
      </button>
    </view>

    <scroll-view class="friends-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && friends.length === 0" class="friends-state">正在加载好友</view>

      <view v-else-if="friends.length === 0" class="friends-empty">
        <view class="empty-mark">
          <app-icon name="user" :size="56" color="#c76f96" />
        </view>
        <text class="empty-title">还没有好友</text>
        <text class="empty-copy">搜索昵称关注对方，互相关注后就会出现在好友列表。</text>
        <button class="empty-button" @tap="addFriend">添加好友</button>
      </view>

      <view v-else class="friends-list">
        <view v-for="user in friends" :key="user.id" class="friend-card">
          <view class="friend-avatar">
            <image
              v-if="avatarUrl(user)"
              class="friend-avatar-image"
              :src="avatarUrl(user)"
              mode="aspectFill"
            />
            <text v-else>{{ user.nickname.slice(0, 1) }}</text>
          </view>

          <view class="friend-main">
            <view class="friend-title-row">
              <text class="friend-name">{{ user.nickname }}</text>
              <text class="friend-badge">好友</text>
            </view>
            <text class="friend-signature">{{ user.signature || user.region || '这个人很神秘' }}</text>
          </view>

          <button
            class="follow-button"
            :disabled="actingId === user.id"
            @tap.stop="toggleFollow(user)"
          >
            {{ actingId === user.id ? '处理中' : '取消关注' }}
          </button>
        </view>
      </view>

      <view v-if="loading && friends.length > 0" class="friends-state">正在加载</view>
      <view v-else-if="!hasMore && friends.length > 0" class="friends-state">已经到底了</view>
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

.friend-count {
  margin-left: 12rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.add-button {
  display: flex;
  flex: none;
  align-items: center;
  height: 60rpx;
  margin-left: 12rpx;
  padding: 0 18rpx;
  line-height: 1;
  background: rgba($rococo-paper, 0.9);
  border: 1rpx solid rgba($rococo-rose, 0.3);
  border-radius: 30rpx;
}

.add-text {
  margin-left: 6rpx;
  color: $rococo-rose;
  font-size: 22rpx;
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

.friends-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.friends-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60rpx;
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
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.9),
    0 8rpx 20rpx rgba(137, 91, 116, 0.06);
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
  border-radius: 50%;
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

.friend-title-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.friend-name {
  max-width: 100%;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 27rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-badge {
  flex: none;
  margin-left: 10rpx;
  padding: 2rpx 10rpx;
  color: $rococo-rose;
  font-size: 18rpx;
  background: rgba($rococo-blush, 0.5);
  border-radius: 14rpx;
}

.friend-signature {
  margin-top: 6rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-button {
  flex: none;
  min-width: 132rpx;
  height: 60rpx;
  margin-left: 14rpx;
  padding: 0 16rpx;
  color: $rococo-rose;
  font-size: 21rpx;
  line-height: 58rpx;
  background: rgba($rococo-paper, 0.9);
  border: 1rpx solid rgba($rococo-rose, 0.34);
  border-radius: 30rpx;
}

.follow-button[disabled] {
  opacity: 0.6;
}
</style>
