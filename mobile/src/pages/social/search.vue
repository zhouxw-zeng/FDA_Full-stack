<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { followSocialUser, searchSocialUsers, unfollowSocialUser } from '@/api/social';
import type { SocialFollowState, SocialUser } from '@/types';

defineOptions({ name: 'SocialSearch' });

const keyword = ref('');
const users = ref<SocialUser[]>([]);
const total = ref(0);
const page = ref(1);
const size = 15;
const loading = ref(false);
const actingId = ref('');
const hasMore = computed(() => users.value.length < total.value);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchToken = 0;

function avatarUrl(user: SocialUser): string {
  return resolveFileUrl(user.avatar);
}

async function loadUsers(reset = false): Promise<void> {
  if (loading.value && !reset) {
    return;
  }

  const token = ++searchToken;
  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result = await searchSocialUsers(keyword.value.trim(), page.value, size);
    if (token !== searchToken) {
      return;
    }
    users.value = reset ? result.list : [...users.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    if (token === searchToken) {
      uni.showToast({
        title: error instanceof Error ? error.message : '搜索失败',
        icon: 'none',
      });
    }
  } finally {
    if (token === searchToken) {
      loading.value = false;
    }
  }
}

function handleKeywordInput(): void {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    searchTimer = null;
    void loadUsers(true);
  }, 300);
}

function clearKeyword(): void {
  keyword.value = '';
  void loadUsers(true);
}

function applyFollowState(targetUserId: string, state: SocialFollowState): void {
  users.value = users.value.map((user) =>
    user.id === targetUserId
      ? {
          ...user,
          isFollowing: state.isFollowing,
          isFollowedBy: state.isFollowedBy,
          isMutual: state.isMutual,
          canChat: state.canChat,
        }
      : user,
  );
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
    void loadUsers();
  }
}

function goBack(): void {
  uni.navigateBack();
}

onLoad(() => {
  void loadUsers(true);
});

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});
</script>

<template>
  <view class="search-page rococo-canvas">
    <view class="search-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">添加好友</text>
    </view>

    <view class="search-toolbar">
      <view class="search-box">
        <app-icon name="search" :size="28" color="#7e6c75" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索用户昵称"
          confirm-type="search"
          @input="handleKeywordInput"
          @confirm="loadUsers(true)"
        />
        <text v-if="keyword" class="search-clear" @tap="clearKeyword">×</text>
      </view>
    </view>

    <view class="search-caption">
      <text>{{ keyword.trim() ? `搜索“${keyword.trim()}”` : '推荐用户' }}</text>
      <text class="search-count">{{ total }} 个结果</text>
    </view>

    <scroll-view class="search-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && users.length === 0" class="search-state">正在搜索用户</view>
      <view v-else-if="users.length === 0" class="search-state">没有找到相关用户</view>

      <view v-else class="user-list">
        <view v-for="user in users" :key="user.id" class="user-card">
          <view class="user-avatar">
            <image
              v-if="avatarUrl(user)"
              class="user-avatar-image"
              :src="avatarUrl(user)"
              mode="aspectFill"
            />
            <text v-else>{{ user.nickname.slice(0, 1) }}</text>
          </view>

          <view class="user-main">
            <view class="user-title-row">
              <text class="user-name">{{ user.nickname }}</text>
              <text v-if="user.isMutual" class="user-badge user-badge--mutual">好友</text>
              <text v-else-if="user.isFollowedBy" class="user-badge">关注了你</text>
            </view>
            <text class="user-signature">
              {{ user.signature || user.region || '这个人很神秘' }}
            </text>
          </view>

          <button
            class="follow-button"
            :class="{ 'follow-button--active': user.isFollowing }"
            :disabled="actingId === user.id"
            @tap.stop="toggleFollow(user)"
          >
            {{
              actingId === user.id
                ? '处理中'
                : user.isFollowing
                  ? '已关注'
                  : user.isFollowedBy
                    ? '回关'
                    : '关注'
            }}
          </button>
        </view>
      </view>

      <view v-if="loading && users.length > 0" class="search-state">正在加载</view>
      <view v-else-if="!hasMore && users.length > 0" class="search-state">已经到底了</view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.search-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.search-nav {
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

.search-toolbar {
  flex: none;
  padding: 22rpx 28rpx 12rpx;
}

.search-box {
  display: flex;
  align-items: center;
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

.search-clear {
  flex: none;
  width: 40rpx;
  color: $rococo-muted;
  font-size: 32rpx;
  line-height: 1;
  text-align: center;
}

.search-caption {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx 12rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.search-count {
  font-size: 21rpx;
}

.search-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 0 28rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.search-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.search-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.search-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.user-card {
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

.user-avatar {
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

.user-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.user-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.user-title-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.user-name {
  max-width: 100%;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 27rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-badge {
  flex: none;
  margin-left: 10rpx;
  padding: 2rpx 10rpx;
  color: $rococo-muted;
  font-size: 18rpx;
  background: rgba($rococo-gold-pale, 0.36);
  border-radius: 14rpx;
}

.user-badge--mutual {
  color: $rococo-rose;
  background: rgba($rococo-blush, 0.5);
}

.user-signature {
  margin-top: 6rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-button {
  flex: none;
  min-width: 120rpx;
  height: 60rpx;
  margin-left: 14rpx;
  padding: 0 18rpx;
  color: #fffdfa;
  font-size: 22rpx;
  line-height: 58rpx;
  background: $rococo-rose;
  border-radius: 30rpx;
}

.follow-button--active {
  color: $rococo-rose;
  background: rgba($rococo-paper, 0.9);
  border: 1rpx solid rgba($rococo-rose, 0.34);
}

.follow-button[disabled] {
  opacity: 0.6;
}
</style>
