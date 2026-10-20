<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import UserProfileCard from '@/components/UserProfileCard.vue';
import { resolveFileUrl } from '@/api/files';
import {
  fetchMyFollowers,
  fetchMyFollowing,
  fetchSocialUser,
  openSocialConversation,
} from '@/api/social';
import {
  getSocialRelationState,
  isFollowedByOnly,
  SOCIAL_RELATION_LABELS,
} from '@/utils/social';
import type { SocialFollowState, SocialUser, SocialUserDetail } from '@/types';

defineOptions({ name: 'SocialRelations' });

type RelationType = 'following' | 'followers';

const relationType = ref<RelationType>('following');
const users = ref<SocialUser[]>([]);
const total = ref(0);
const page = ref(1);
const size = 15;
const loading = ref(false);
const cardVisible = ref(false);
const cardLoading = ref(false);
const profileUser = ref<SocialUserDetail | null>(null);

const hasMore = computed(() => users.value.length < total.value);
const pageTitle = computed(() =>
  relationType.value === 'following' ? '我的关注' : '我的粉丝',
);

function avatarUrl(user: SocialUser): string {
  return resolveFileUrl(user.avatar);
}

function relationLabel(user: SocialUser): string {
  return isFollowedByOnly(user)
    ? '关注了你'
    : SOCIAL_RELATION_LABELS[getSocialRelationState(user)];
}

async function loadUsers(reset = false): Promise<void> {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const result =
      relationType.value === 'following'
        ? await fetchMyFollowing(page.value, size)
        : await fetchMyFollowers(page.value, size);
    users.value = reset ? result.list : [...users.value, ...result.list];
    total.value = result.total;
    if (result.list.length) {
      page.value += 1;
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载列表失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function loadMore(): void {
  if (hasMore.value) {
    void loadUsers();
  }
}

async function openUser(user: SocialUser): Promise<void> {
  cardVisible.value = true;
  cardLoading.value = true;
  profileUser.value = null;
  try {
    profileUser.value = await fetchSocialUser(user.id);
  } catch (error) {
    cardVisible.value = false;
    uni.showToast({
      title: error instanceof Error ? error.message : '加载用户资料失败',
      icon: 'none',
    });
  } finally {
    cardLoading.value = false;
  }
}

function handleFollowChange(state: SocialFollowState): void {
  if (relationType.value === 'following' && !state.isFollowing) {
    users.value = users.value.filter((user) => user.id !== state.targetUserId);
    total.value = Math.max(0, total.value - 1);
    return;
  }

  users.value = users.value.map((user) =>
    user.id === state.targetUserId
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

async function handleChat(user: SocialUserDetail): Promise<void> {
  try {
    const conversation = await openSocialConversation(user.id);
    cardVisible.value = false;
    uni.navigateTo({
      url: `/pages/social/chat?id=${encodeURIComponent(
        conversation.id,
      )}&userId=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.nickname)}`,
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '创建会话失败',
      icon: 'none',
    });
  }
}

function handleDynamics(user: SocialUserDetail): void {
  cardVisible.value = false;
  uni.navigateTo({
    url: `/pages/social/dynamics?id=${encodeURIComponent(user.id)}&name=${encodeURIComponent(
      user.nickname,
    )}`,
  });
}

function goBack(): void {
  uni.navigateBack();
}

onLoad((options) => {
  const type = String(options?.type || '');
  relationType.value = type === 'followers' ? 'followers' : 'following';
  void loadUsers(true);
});
</script>

<template>
  <view class="relations-page rococo-canvas">
    <view class="relations-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">{{ pageTitle }}</text>
      <text class="nav-count">{{ total }}</text>
    </view>

    <scroll-view class="relations-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view v-if="loading && users.length === 0" class="relations-state">正在加载</view>
      <view v-else-if="users.length === 0" class="relations-state">
        {{ relationType === 'following' ? '还没有关注任何人' : '还没有粉丝' }}
      </view>

      <view v-else class="relation-list">
        <view
          v-for="user in users"
          :key="user.id"
          class="relation-card"
          @tap="openUser(user)"
        >
          <view class="relation-avatar">
            <image
              v-if="avatarUrl(user)"
              class="relation-avatar-image"
              :src="avatarUrl(user)"
              mode="aspectFill"
            />
            <text v-else>{{ user.nickname.slice(0, 1) }}</text>
          </view>

          <view class="relation-main">
            <text class="relation-name">{{ user.nickname }}</text>
            <text class="relation-signature">
              {{ user.signature || user.region || '这个人很神秘' }}
            </text>
          </view>

          <text class="relation-badge">{{ relationLabel(user) }}</text>
        </view>
      </view>

      <view v-if="loading && users.length > 0" class="relations-state">正在加载</view>
      <view v-else-if="!hasMore && users.length > 0" class="relations-state">已经到底了</view>
    </scroll-view>

    <UserProfileCard
      v-model:visible="cardVisible"
      :user="profileUser"
      :loading="cardLoading"
      @follow-change="handleFollowChange"
      @chat="handleChat"
      @dynamics="handleDynamics"
    />
  </view>
</template>

<style scoped lang="scss">
.relations-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.relations-nav {
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
  font-size: 36rpx;
  font-weight: 600;
}

.nav-count {
  flex: none;
  color: $rococo-muted;
  font-size: 22rpx;
}

.relations-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 20rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.relations-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.relations-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.relations-state {
  padding: 60rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.relation-card {
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

.relation-avatar {
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

.relation-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.relation-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.relation-name {
  color: $rococo-ink;
  font-size: 28rpx;
  font-weight: 600;
}

.relation-signature {
  margin-top: 6rpx;
  overflow: hidden;
  color: $rococo-muted;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-badge {
  flex: none;
  margin-left: 14rpx;
  padding: 4rpx 14rpx;
  color: $rococo-rose;
  font-size: 20rpx;
  background: rgba($rococo-blush, 0.42);
  border-radius: 18rpx;
}
</style>
