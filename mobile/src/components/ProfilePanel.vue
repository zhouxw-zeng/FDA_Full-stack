<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { resolveFileUrl } from '@/api/files';
import { connectNotificationSocket, type NotificationSocketHandle } from '@/api/notification-socket';
import { fetchUnreadNotificationCount } from '@/api/notifications';
import { useUserStore } from '@/stores/user';

defineOptions({ name: 'ProfilePanel' });

const emit = defineEmits<{ chat: [] }>();

interface FunctionItem {
  key: 'moments' | 'favorites' | 'message' | 'logout';
  icon: string;
  label: string;
  badge?: number;
}

type MetricKey = 'chat' | 'publish' | 'likes';

interface MetricItem {
  key: MetricKey;
  label: string;
  icon: string;
}

const userStore = useUserStore();
const loggingOut = ref(false);
const unreadCount = ref(0);

let notificationSocket: NotificationSocketHandle | null = null;

const promoSlides = [
  {
    kicker: '家庭动态',
    title: '把每一段日常\n留在这里',
    subtitle: '推广位 01 · 可接入运营轮播',
    className: 'promo-slide--one',
  },
  {
    kicker: '温暖记录',
    title: '分享生活里的\n小确幸',
    subtitle: '推广位 02 · 可接入活动内容',
    className: 'promo-slide--two',
  },
];

const displayName = computed(
  () => userStore.user?.nickname || userStore.user?.username || '未命名用户',
);
const avatarText = computed(() => displayName.value.slice(0, 1));
const avatarUrl = computed(() => resolveFileUrl(userStore.user?.avatar));
const progressValue = computed(() =>
  Math.min(100, Math.max(20, (userStore.user?.vipLevel ?? 1) * 20)),
);
const progressWidth = computed(() => `${progressValue.value}%`);

const metrics: MetricItem[] = [
  { key: 'chat', label: '聊天入口', icon: '/static/icons/message-icon.png' },
  { key: 'publish', label: '发布动态', icon: '/static/icons/push_icon.png' },
  { key: 'likes', label: '我的喜欢', icon: '/static/icons/likes-icon.png' },
];

const functionItems = computed<FunctionItem[]>(() => [
  { key: 'moments', icon: '/static/icons/my-dynamic-icon.png', label: '动态' },
  { key: 'favorites', icon: '/static/icons/collect-icon.png', label: '我的收藏' },
  {
    key: 'message',
    icon: '/static/icons/message-icon.png',
    label: '消息通知',
    badge: unreadCount.value,
  },
  { key: 'logout', icon: '/static/icons/loginout-icon.png', label: '退出登录' },
]);

function goEdit(): void {
  uni.navigateTo({ url: '/pages/profile/edit' });
}

function goLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

function goMyDynamics(): void {
  uni.navigateTo({ url: '/pages/dynamic/records?status=published' });
}

function handleMetric(key: MetricKey): void {
  if (key === 'chat') {
    emit('chat');
    return;
  }

  if (key === 'publish') {
    uni.navigateTo({ url: '/pages/dynamic/publish' });
    return;
  }

  uni.navigateTo({ url: '/pages/dynamic/liked' });
}

async function initialize(): Promise<void> {
  if (!userStore.isLoggedIn) {
    return;
  }

  await Promise.all([
    userStore.loadProfile().catch(() => undefined),
    userStore.loadUserInfo().catch(() => undefined),
    loadUnreadCount(),
  ]);
}

async function loadUnreadCount(): Promise<void> {
  try {
    const result = await fetchUnreadNotificationCount();
    unreadCount.value = result.count;
  } catch {
    unreadCount.value = 0;
  }
}

function handleUnreadChanged(count: number): void {
  unreadCount.value = Number(count) || 0;
}

function setupNotificationSocket(): void {
  notificationSocket?.close();
  notificationSocket = connectNotificationSocket({
    onNew: (payload) => {
      unreadCount.value = payload.unreadCount;
    },
  });
}

function teardownNotificationSocket(): void {
  notificationSocket?.close();
  notificationSocket = null;
}

async function logout(): Promise<void> {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;
  try {
    await userStore.logout();
    uni.showToast({ title: '已退出登录', icon: 'success' });
  } finally {
    loggingOut.value = false;
  }
}

function handleFunction(item: FunctionItem): void {
  if (item.key === 'logout') {
    void logout();
    return;
  }

  if (item.key === 'moments') {
    goMyDynamics();
    return;
  }

  if (item.key === 'favorites') {
    uni.navigateTo({ url: '/pages/dynamic/favorites' });
    return;
  }

  if (item.key === 'message') {
    uni.navigateTo({ url: '/pages/profile/notifications' });
    return;
  }

  uni.showToast({ title: '功能预留中', icon: 'none' });
}

onMounted(() => {
  uni.$on('notification:unread-changed', handleUnreadChanged);
  void initialize();
  if (userStore.isLoggedIn) {
    setupNotificationSocket();
  }
});

onUnmounted(() => {
  uni.$off('notification:unread-changed', handleUnreadChanged);
  teardownNotificationSocket();
});

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      void initialize();
      setupNotificationSocket();
    } else {
      unreadCount.value = 0;
      teardownNotificationSocket();
    }
  },
);
</script>

<template>
  <view class="profile-panel">
    <scroll-view class="profile-scroll" scroll-y>
      <view class="banner-header">
        <swiper
          class="promo-swiper"
          circular
          autoplay
          indicator-dots
          indicator-color="rgba(255, 253, 250, 0.48)"
          indicator-active-color="#fffdfa"
          :interval="4500"
          :duration="450"
        >
          <swiper-item v-for="slide in promoSlides" :key="slide.className">
            <view class="promo-slide" :class="slide.className">
              <text class="promo-kicker">{{ slide.kicker }}</text>
              <text class="promo-title">{{ slide.title }}</text>
              <text class="promo-subtitle">{{ slide.subtitle }}</text>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <view class="main-content">
        <template v-if="userStore.isLoggedIn">
          <view class="user-card">
            <view class="card-top">
              <view class="avatar" @tap="goEdit">
                <image
                  v-if="avatarUrl"
                  class="avatar-image"
                  :src="avatarUrl"
                  mode="aspectFill"
                />
                <text v-else class="avatar-text">{{ avatarText }}</text>
                <view class="avatar-edit-dot"></view>
              </view>

              <view class="user-details">
                <text class="username">{{ displayName }}</text>
                <text class="level-tag">V{{ userStore.user?.vipLevel ?? 1 }} 会员</text>
              </view>

              <view class="mascot-img"></view>
            </view>

            <view class="benefits-link">
              <text>查看家庭会员成长权益</text>
              <text class="benefits-arrow">›</text>
            </view>

            <view class="progress-container">
              <view class="progress-bar" :style="{ width: progressWidth }"></view>
            </view>

            <view class="progress-text">
              <text class="text-left">继续完善资料，解锁更多功能</text>
              <text class="text-right">{{ userStore.user?.vipLevel ?? 1 }}/5</text>
            </view>
          </view>

          <view class="stats-grid">
            <view
              v-for="metric in metrics"
              :key="metric.key"
              class="stat-card"
              @tap="handleMetric(metric.key)"
            >
              <view class="stat-icon">
                <image class="stat-icon-image" :src="metric.icon" mode="aspectFill" />
              </view>
              <text class="stat-label">{{ metric.label }}</text>
            </view>
          </view>

          <view class="function-section">
            <view class="section-head">
              <text class="section-title">功能中心</text>
              <text class="section-more">更多 ›</text>
            </view>
            <view class="function-grid">
              <view
                v-for="item in functionItems"
                :key="item.key"
                class="function-item"
                @tap="handleFunction(item)"
              >
                <view class="function-icon-wrap">
                  <view class="function-icon">
                    <image class="function-icon-image" :src="item.icon" mode="aspectFill" />
                  </view>
                  <text v-if="item.badge" class="function-badge">
                    {{ item.badge > 99 ? '99+' : item.badge }}
                  </text>
                </view>
                <text class="function-label">{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="promo-banner">
            <text class="banner-kicker">推广位预留</text>
            <text class="banner-title">活动与权益模块</text>
            <text class="banner-action">点击查看 ›</text>
          </view>
        </template>

        <view v-else class="guest-card">
          <text class="guest-title">登录后查看个人信息</text>
          <text class="guest-copy">同步资料、动态与个性化功能。</text>
          <button class="login-button" @tap="goLogin">前往登录</button>
        </view>

        <view class="watermark">
          <text>Avin 技术开发支持</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
$page-bg: #f7f8fa;
$card-white: #ffffff;
$text-main: #222222;
$text-sub: #999999;
$brand-brown: #8a5a44;
$tag-bg: #f5eee8;
$progress-bg: #f0f0f0;
$progress-fill: #d9cbc1;
$radius-card: 16px;
$radius-small: 12px;

.profile-panel {
  height: 100%;
  overflow: hidden;
  background: $page-bg;
}

.profile-scroll {
  height: 100%;
}

.banner-header {
  position: relative;
  width: 100%;
  height: 360rpx;
  overflow: hidden;
}

.promo-swiper {
  width: 100%;
  height: 100%;
}

.promo-slide {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 42rpx 36rpx;
  box-sizing: border-box;
}

.promo-slide--one {
  background: linear-gradient(180deg, #fcecc1 0%, #e2cc9a 100%);
}

.promo-slide--two {
  background: linear-gradient(180deg, #f4d8d0 0%, #d9cbc1 100%);
}

.promo-kicker {
  color: $brand-brown;
  font-size: 21rpx;
  font-style: italic;
}

.promo-title {
  margin-top: 12rpx;
  color: #6a4a3a;
  font-family:
    Georgia,
    'Times New Roman',
    'Songti SC',
    serif;
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.24;
  white-space: pre-line;
}

.promo-subtitle {
  margin-top: 16rpx;
  color: rgba(106, 74, 58, 0.72);
  font-size: 23rpx;
}

.main-content {
  position: relative;
  z-index: 10;
  padding: 0 32rpx 48rpx;
  margin-top: -70px;
}

.user-card {
  width: 100%;
  height: 320rpx;
  padding: 28rpx 30rpx;
  background: $card-white;
  border-radius: $radius-card;
  box-sizing: border-box;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  align-items: center;
  min-width: 0;
}

.avatar {
  position: relative;
  flex: none;
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #f5eee8;
}

.avatar-image,
.avatar-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
}

.avatar-image {
  display: block;
}

.avatar-text {
  color: $brand-brown;
  font-size: 36rpx;
  font-weight: 600;
}

.avatar-edit-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24rpx;
  height: 24rpx;
  background: $brand-brown;
  border: 4rpx solid $card-white;
  border-radius: 8rpx;
}

.user-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 20rpx;
}

.username {
  overflow: hidden;
  color: $text-main;
  font-size: 36rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-tag {
  align-self: flex-start;
  margin-top: 10rpx;
  padding: 5rpx 14rpx;
  color: $brand-brown;
  font-size: 22rpx;
  background: $tag-bg;
  border-radius: 18rpx;
}

.mascot-img {
  flex: none;
  width: 88rpx;
  height: 88rpx;
  margin-left: 12rpx;
  background: linear-gradient(145deg, #f5eee8, #e4d5ca);
  border: 1rpx solid rgba($brand-brown, 0.14);
  border-radius: 16rpx 16rpx 24rpx 24rpx;
  opacity: 0.9;
}

.benefits-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  color: #666666;
  font-size: 24rpx;
}

.benefits-arrow {
  font-size: 34rpx;
  line-height: 1;
}

.progress-container {
  width: 100%;
  height: 12rpx;
  margin-top: 18rpx;
  overflow: hidden;
  background: $progress-bg;
  border-radius: 6rpx;
}

.progress-bar {
  height: 100%;
  background: $progress-fill;
  border-radius: 6rpx;
}

.progress-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
  color: $text-sub;
  font-size: 21rpx;
}

.text-right {
  font-family: monospace;
}

.stats-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.stat-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 24rpx 12rpx;
  background: $card-white;
  border-radius: $radius-small;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  overflow: hidden;
  background: $tag-bg;
  border: 1rpx solid rgba($brand-brown, 0.12);
  border-radius: 18rpx;
  box-sizing: border-box;
}

.stat-icon-image {
  display: block;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transform-origin: center center;
}

.stat-label {
  margin-top: 14rpx;
  color: $text-sub;
  font-size: 22rpx;
  text-align: center;
}

.function-section,
.promo-banner {
  margin-top: 16px;
  padding: 28rpx;
  background: $card-white;
  border-radius: $radius-small;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  color: $text-main;
  font-size: 30rpx;
  font-weight: 600;
}

.section-more {
  color: $text-sub;
  font-size: 23rpx;
}

.function-grid {
  display: flex;
  flex-wrap: wrap;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
  padding: 10rpx 0;
  box-sizing: border-box;
}

.function-icon-wrap {
  position: relative;
}

.function-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  overflow: hidden;
  background: $tag-bg;
  border: 1rpx solid rgba($brand-brown, 0.12);
  border-radius: 18rpx;
  box-sizing: border-box;
}

.function-icon-image {
  display: block;
  width: 100%;
  height: 100%;
  transform: scale(1.62);
  transform-origin: center center;
}

.function-badge {
  position: absolute;
  top: -8rpx;
  right: -10rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  color: #fffdfa;
  font-size: 18rpx;
  line-height: 30rpx;
  text-align: center;
  background: $rococo-rose;
  border: 2rpx solid $card-white;
  border-radius: 17rpx;
  box-sizing: border-box;
}

.function-label {
  margin-top: 12rpx;
  color: $text-main;
  font-size: 23rpx;
}

.promo-banner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 210rpx;
  background: linear-gradient(112deg, #fcecc1, #ffffff 52%, #e4d5ca);
}

.banner-kicker {
  color: $brand-brown;
  font-size: 21rpx;
}

.banner-title {
  margin-top: 10rpx;
  color: $text-main;
  font-size: 34rpx;
  font-weight: 600;
}

.banner-action {
  margin-top: 16rpx;
  color: $brand-brown;
  font-size: 23rpx;
}

.guest-card {
  margin-top: 16px;
  padding: 52rpx 36rpx;
  text-align: center;
  background: $card-white;
  border-radius: $radius-card;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.guest-title {
  display: block;
  color: $text-main;
  font-size: 32rpx;
  font-weight: 600;
}

.guest-copy {
  display: block;
  margin: 12rpx 0 28rpx;
  color: $text-sub;
  font-size: 24rpx;
}

.login-button {
  width: 240rpx;
  height: 76rpx;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 74rpx;
  background: $brand-brown;
  border-radius: 8rpx;
}

.watermark {
  padding: 44rpx 32rpx calc(44rpx + env(safe-area-inset-bottom));
  color: rgba($text-sub, 0.78);
  font-size: 21rpx;
  text-align: center;
}
</style>
