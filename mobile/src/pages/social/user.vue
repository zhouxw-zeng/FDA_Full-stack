<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { resolveFileUrl } from '@/api/files';
import { fetchSocialUser, followSocialUser, unfollowSocialUser } from '@/api/social';
import {
  getSocialRelationState,
  isFollowedByOnly,
  SOCIAL_RELATION_BUTTON_LABELS,
} from '@/utils/social';
import type { SocialUser } from '@/types';

defineOptions({ name: 'SocialUser' });

const userId = ref('');
const user = ref<SocialUser | null>(null);
const loading = ref(true);
const acting = ref(false);

const avatarUrl = computed(() => resolveFileUrl(user.value?.avatar));
const avatarText = computed(() => (user.value?.nickname || '用').slice(0, 1));

async function loadUser(): Promise<void> {
  if (!userId.value) {
    uni.showToast({ title: '缺少用户 ID', icon: 'none' });
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    user.value = await fetchSocialUser(userId.value);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '加载用户失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function toggleFollow(): Promise<void> {
  const target = user.value;
  if (!target || acting.value) {
    return;
  }

  acting.value = true;
  const wasFollowing = target.isFollowing;
  try {
    const state = wasFollowing
      ? await unfollowSocialUser(target.id)
      : await followSocialUser(target.id);
    user.value = {
      ...target,
      isFollowing: state.isFollowing,
      isFollowedBy: state.isFollowedBy,
      isMutual: state.isMutual,
      canChat: state.canChat,
    };
    uni.showToast({ title: wasFollowing ? '已取消关注' : '已关注', icon: 'none' });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  } finally {
    acting.value = false;
  }
}

function goBack(): void {
  uni.navigateBack();
}

onLoad((options) => {
  userId.value = String(options?.id || '');
  void loadUser();
});
</script>

<template>
  <view class="user-page rococo-canvas">
    <view class="user-nav">
      <button class="nav-back" @tap="goBack">
        <app-icon name="back" :size="34" color="#493944" />
      </button>
      <text class="nav-title">用户主页</text>
    </view>

    <view v-if="loading" class="user-state">正在加载</view>

    <view v-else-if="user" class="user-detail">
      <view class="user-card">
        <view class="user-avatar">
          <image
            v-if="avatarUrl"
            class="user-avatar-image"
            :src="avatarUrl"
            mode="aspectFill"
          />
          <text v-else>{{ avatarText }}</text>
        </view>

        <text class="user-name">{{ user.nickname }}</text>

        <view class="user-tags">
          <text class="user-tag">V{{ user.vipLevel }}</text>
          <text v-if="user.isMutual" class="user-tag user-tag--mutual">互关</text>
          <text v-else-if="isFollowedByOnly(user)" class="user-tag">关注了你</text>
        </view>

        <text class="user-signature">{{ user.signature || '这个人很神秘' }}</text>
        <text class="user-region">{{ user.region || '未填写地区' }}</text>

        <button
          class="follow-button"
          :class="`follow-button--${getSocialRelationState(user)}`"
          :disabled="acting"
          @tap="toggleFollow"
        >
          {{
            acting
              ? '处理中'
              : SOCIAL_RELATION_BUTTON_LABELS[getSocialRelationState(user)]
          }}
        </button>
      </view>
    </view>

    <view v-else class="user-state">用户不存在或不可用</view>
  </view>
</template>

<style scoped lang="scss">
.user-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  background-color: $rococo-stucco;
}

.user-nav {
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

.user-state {
  padding: 80rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.user-detail {
  padding: 28rpx;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 36rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 16rpx 40rpx rgba(137, 91, 116, 0.08);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 156rpx;
  height: 156rpx;
  overflow: hidden;
  color: $rococo-rose;
  font-size: 52rpx;
  font-weight: 600;
  background: $rococo-blush;
  border: 4rpx solid rgba($rococo-gold-rich, 0.28);
  border-radius: 50%;
  box-sizing: border-box;
}

.user-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
}

.user-name {
  margin-top: 22rpx;
  color: $rococo-ink;
  font-size: 36rpx;
  font-weight: 600;
}

.user-tags {
  display: flex;
  align-items: center;
  margin-top: 14rpx;
}

.user-tag {
  margin: 0 6rpx;
  padding: 4rpx 14rpx;
  color: $rococo-gold-rich;
  font-size: 20rpx;
  background: rgba($rococo-gold-pale, 0.42);
  border-radius: 18rpx;
}

.user-tag--mutual {
  color: $rococo-rose;
  background: rgba($rococo-blush, 0.5);
}

.user-signature {
  margin-top: 22rpx;
  color: $rococo-muted;
  font-size: 25rpx;
  line-height: 1.6;
  text-align: center;
}

.user-region {
  margin-top: 10rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.follow-button {
  min-width: 260rpx;
  height: 76rpx;
  margin-top: 34rpx;
  padding: 0 32rpx;
  color: #fffdfa;
  font-size: 26rpx;
  line-height: 74rpx;
  background: linear-gradient(
    135deg,
    $rococo-bright-pink 0%,
    $rococo-rose 58%,
    $rococo-bright-pink 100%
  );
  border: 1rpx solid rgba($rococo-gold-pale, 0.72);
  border-radius: 38rpx;
  box-sizing: border-box;
  box-shadow:
    0 10rpx 22rpx rgba($rococo-rose, 0.24),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
}

.follow-button--following {
  color: $rococo-rose;
  background: linear-gradient(
    135deg,
    rgba($rococo-paper, 0.98),
    rgba($rococo-pink-blue, 0.26)
  );
  border: 1rpx solid rgba($rococo-gold-rich, 0.46);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.follow-button--mutual {
  color: $rococo-gold-rich;
  background: linear-gradient(
    135deg,
    rgba($rococo-gold-pale, 0.62),
    rgba($rococo-cream, 0.92)
  );
  border: 1rpx solid rgba($rococo-gold-rich, 0.52);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.85);
}

.follow-button[disabled] {
  opacity: 0.6;
}
</style>
