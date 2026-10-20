<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { resolveFileUrl } from '@/api/files';
import { followSocialUser, unfollowSocialUser } from '@/api/social';
import {
  getSocialRelationState,
  isFollowedByOnly,
  SOCIAL_RELATION_BUTTON_LABELS,
} from '@/utils/social';
import type { SocialFollowState, SocialUserDetail } from '@/types';

defineOptions({ name: 'UserProfileCard' });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    user?: SocialUserDetail | null;
    loading?: boolean;
  }>(),
  {
    user: null,
    loading: false,
  },
);

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  chat: [user: SocialUserDetail];
  dynamics: [user: SocialUserDetail];
  'follow-change': [state: SocialFollowState];
}>();

const currentUser = ref<SocialUserDetail | null>(null);
const followLoading = ref(false);

const avatarUrl = computed(() => resolveFileUrl(currentUser.value?.avatar));
const avatarText = computed(() => (currentUser.value?.nickname || '用').slice(0, 1));
const relationState = computed(() =>
  currentUser.value ? getSocialRelationState(currentUser.value) : 'none',
);

const stats = computed(() => [
  { key: 'following', label: '关注', value: currentUser.value?.followingCount ?? 0 },
  { key: 'followers', label: '粉丝', value: currentUser.value?.followersCount ?? 0 },
  { key: 'dynamics', label: '动态', value: currentUser.value?.dynamicCount ?? 0 },
]);

watch(
  () => props.user,
  (user) => {
    currentUser.value = user;
  },
  { immediate: true },
);

function close(): void {
  emit('update:visible', false);
}

function handleChat(): void {
  if (currentUser.value) {
    emit('chat', currentUser.value);
  }
}

function handleDynamics(): void {
  if (currentUser.value) {
    emit('dynamics', currentUser.value);
  }
}

async function toggleFollow(): Promise<void> {
  const target = currentUser.value;
  if (!target || followLoading.value) {
    return;
  }

  followLoading.value = true;
  const shouldUnfollow = getSocialRelationState(target) !== 'none';
  try {
    const state = shouldUnfollow
      ? await unfollowSocialUser(target.id)
      : await followSocialUser(target.id);
    currentUser.value = {
      ...target,
      isFollowing: state.isFollowing,
      isFollowedBy: state.isFollowedBy,
      isMutual: state.isMutual,
      canChat: state.canChat,
    };
    emit('follow-change', state);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  } finally {
    followLoading.value = false;
  }
}
</script>

<template>
  <view v-if="visible" class="user-card-layer">
    <view class="user-card-mask" @tap="close"></view>

    <view class="profile-card" @tap.stop>
      <view class="card-curve card-curve--top"></view>
      <view class="card-curve card-curve--bottom"></view>

      <button class="card-close" @tap="close">
        <app-icon name="close" :size="26" color="#c76f96" />
      </button>

      <view v-if="loading || !currentUser" class="card-loading">正在加载资料</view>

      <template v-else>
        <view class="card-avatar">
          <image
            v-if="avatarUrl"
            class="card-avatar-image"
            :src="avatarUrl"
            mode="aspectFill"
          />
          <text v-else>{{ avatarText }}</text>
        </view>

        <text class="card-name">{{ currentUser.nickname }}</text>

        <view class="card-tags">
          <text class="card-tag">V{{ currentUser.vipLevel }}</text>
          <text v-if="currentUser.isMutual" class="card-tag card-tag--mutual">互关</text>
          <text v-else-if="isFollowedByOnly(currentUser)" class="card-tag">关注了你</text>
        </view>

        <button
          class="follow-toggle"
          :class="`follow-toggle--${relationState}`"
          :disabled="followLoading"
          @tap="toggleFollow"
        >
          {{ followLoading ? '处理中' : SOCIAL_RELATION_BUTTON_LABELS[relationState] }}
        </button>

        <text class="card-signature">{{ currentUser.signature || '这个人很神秘' }}</text>
        <text class="card-region">{{ currentUser.region || '未填写地区' }}</text>

        <view class="card-stats">
          <view v-for="item in stats" :key="item.key" class="card-stat">
            <text class="stat-value">{{ item.value }}</text>
            <text class="stat-label">{{ item.label }}</text>
          </view>
        </view>

        <view class="card-actions">
          <button class="action-button action-button--primary" @tap="handleChat">
            <app-icon name="comment" :size="26" color="#fffdfa" />
            <text class="action-text">聊天</text>
          </button>
          <button class="action-button action-button--ghost" @tap="handleDynamics">
            <app-icon name="image" :size="26" color="#c76f96" />
            <text class="action-text action-text--ghost">查看动态</text>
          </button>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped lang="scss">
.user-card-layer {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 13vh;
  box-sizing: border-box;
}

.user-card-mask {
  position: absolute;
  inset: 0;
  background: rgba($rococo-ink, 0.38);
}

.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(100% - 96rpx);
  padding: 44rpx 34rpx 32rpx;
  overflow: hidden;
  background:
    linear-gradient(126deg, rgba($rococo-pink-blue, 0.3), transparent 42%),
    linear-gradient(302deg, rgba($rococo-pink-light, 0.32), transparent 46%),
    $rococo-cream;
  border: 1rpx solid rgba($rococo-gold-rich, 0.42);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 24rpx 64rpx rgba(137, 91, 116, 0.2);
}

.card-curve {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.card-curve--top {
  top: -190rpx;
  right: -160rpx;
  width: 340rpx;
  height: 340rpx;
  border: 2rpx solid rgba($rococo-gold-rich, 0.26);
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(18deg);
}

.card-curve--bottom {
  bottom: -220rpx;
  left: -170rpx;
  width: 360rpx;
  height: 360rpx;
  border: 2rpx solid rgba($rococo-pink-blue, 0.32);
  border-right-color: transparent;
  border-top-color: transparent;
  transform: rotate(-12deg);
}

.card-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  padding: 0;
  line-height: 1;
  background: rgba($rococo-paper, 0.76);
  border: 1rpx solid rgba($rococo-pink-blue, 0.44);
  border-radius: 50%;
}

.card-loading {
  padding: 70rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
}

.card-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 148rpx;
  height: 148rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 48rpx;
  font-weight: 600;
  background: $rococo-blush;
  border: 4rpx solid rgba($rococo-gold-rich, 0.3);
  border-radius: 50%;
  box-sizing: border-box;
}

.card-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.card-name {
  margin-top: 20rpx;
  color: $rococo-ink;
  font-size: 34rpx;
  font-weight: 600;
}

.card-tags {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.card-tag {
  margin: 0 6rpx;
  padding: 4rpx 14rpx;
  color: $rococo-gold-rich;
  font-size: 20rpx;
  background: rgba($rococo-gold-pale, 0.42);
  border-radius: 18rpx;
}

.card-tag--mutual {
  color: $rococo-rose;
  background: rgba($rococo-blush, 0.5);
}

.follow-toggle {
  min-width: 150rpx;
  height: 56rpx;
  margin-top: 16rpx;
  padding: 0 24rpx;
  color: #fffdfa;
  font-size: 22rpx;
  line-height: 54rpx;
  background: linear-gradient(
    135deg,
    $rococo-bright-pink 0%,
    $rococo-rose 58%,
    $rococo-bright-pink 100%
  );
  border: 1rpx solid rgba($rococo-gold-pale, 0.72);
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow:
    0 8rpx 18rpx rgba($rococo-rose, 0.22),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
}

.follow-toggle--following {
  color: $rococo-rose;
  background: linear-gradient(
    135deg,
    rgba($rococo-paper, 0.98),
    rgba($rococo-pink-blue, 0.26)
  );
  border: 1rpx solid rgba($rococo-gold-rich, 0.46);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.follow-toggle--mutual {
  color: $rococo-gold-rich;
  background: linear-gradient(
    135deg,
    rgba($rococo-gold-pale, 0.62),
    rgba($rococo-cream, 0.92)
  );
  border: 1rpx solid rgba($rococo-gold-rich, 0.52);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.85);
}

.follow-toggle[disabled] {
  opacity: 0.6;
}

.card-signature {
  margin-top: 18rpx;
  color: $rococo-muted;
  font-size: 24rpx;
  line-height: 1.6;
  text-align: center;
}

.card-region {
  margin-top: 8rpx;
  color: $rococo-muted;
  font-size: 21rpx;
}

.card-stats {
  display: flex;
  width: 100%;
  margin-top: 26rpx;
  padding: 20rpx 0;
  background: rgba($rococo-paper, 0.72);
  border: 1rpx solid rgba($rococo-gold-rich, 0.2);
  border-radius: 8rpx;
  box-sizing: border-box;
}

.card-stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.stat-value {
  color: $rococo-ink;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  margin-top: 4rpx;
  color: $rococo-muted;
  font-size: 21rpx;
}

.card-actions {
  display: flex;
  width: 100%;
  margin-top: 24rpx;
}

.action-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  padding: 0;
  line-height: 1;
  border-radius: 38rpx;
}

.action-button--primary {
  color: #fffdfa;
  background: $rococo-rose;
}

.action-button--ghost {
  margin-left: 16rpx;
  background: rgba($rococo-paper, 0.86);
  border: 1rpx solid rgba($rococo-rose, 0.32);
}

.action-text {
  margin-left: 8rpx;
  font-size: 25rpx;
}

.action-text--ghost {
  color: $rococo-rose;
}
</style>
