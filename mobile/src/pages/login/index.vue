<script setup lang="ts">
import { ref } from 'vue';

import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const phone = ref('');
const password = ref('');
const loading = ref(false);

function goBack(): void {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/index/index' });
}

async function submit(): Promise<void> {
  if (loading.value) {
    return;
  }

  if (!/^1\d{10}$/.test(phone.value.trim())) {
    uni.showToast({ title: '请输入 11 位手机号', icon: 'none' });
    return;
  }

  if (password.value.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await userStore.login({
      phone: phone.value.trim(),
      password: password.value,
    });
    uni.showToast({ title: '登录成功', icon: 'success' });
    uni.reLaunch({ url: '/pages/index/index' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="login-page rococo-canvas">
    <view class="rococo-curve rococo-curve--top"></view>
    <view class="rococo-curve rococo-curve--bottom"></view>
    <view class="porcelain-shell"></view>

    <view class="back-row">
      <button class="back-button" @tap="goBack">‹ 返回</button>
    </view>

    <view class="login-stage">
      <view class="brand-lockup">
        <text class="brand-kicker">Share Happiness  Enjoy Together.</text>
        <text class="brand-title">家庭动态小助手</text>
      </view>

      <view class="login-card rococo-panel">
        <view class="field">
          <text class="field-label">手机号</text>
          <input
            v-model="phone"
            class="field-input"
            maxlength="11"
            placeholder="请输入手机号"
          />
        </view>
        <view class="field">
          <text class="field-label">密码</text>
          <input
            v-model="password"
            class="field-input"
            password
            placeholder="请输入密码"
            @confirm="submit"
          />
        </view>
        <button class="login-button" :disabled="loading" @tap="submit">
          {{ loading ? '正在登录' : '登录' }}
        </button>
      </view>
    </view>

    <view class="login-footer">
      <view class="ornament-line">
        <view class="ornament-gem"></view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--status-bar-height) 32rpx calc(28rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow: hidden;
}

.rococo-curve {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
}

.rococo-curve::before {
  position: absolute;
  border-radius: 50%;
  content: '';
}

.rococo-curve--top {
  top: -230rpx;
  right: -220rpx;
  width: 520rpx;
  height: 520rpx;
  border: 2rpx solid rgba($rococo-gold-rich, 0.34);
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(16deg);
}

.rococo-curve--top::before {
  inset: 34rpx;
  border: 2rpx solid rgba($rococo-pink-blue, 0.34);
  border-right-color: transparent;
  border-top-color: transparent;
  transform: rotate(38deg);
}

.rococo-curve--bottom {
  bottom: -260rpx;
  left: -240rpx;
  width: 560rpx;
  height: 560rpx;
  border: 2rpx solid rgba($rococo-pink-light, 0.58);
  border-right-color: transparent;
  border-top-color: transparent;
  transform: rotate(-12deg);
}

.rococo-curve--bottom::before {
  inset: 38rpx;
  border: 2rpx solid rgba($rococo-bright-blue, 0.22);
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(-28deg);
}

.porcelain-shell {
  position: absolute;
  top: 180rpx;
  right: -120rpx;
  z-index: 0;
  width: 360rpx;
  height: 250rpx;
  background: repeating-linear-gradient(
    90deg,
    rgba($rococo-gold-rich, 0.08) 0 1rpx,
    transparent 1rpx 20rpx
  );
  border: 2rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 50% 50% 16rpx 16rpx;
  opacity: 0.72;
  transform: rotate(-16deg) skewX(3deg);
  pointer-events: none;
}

.porcelain-shell::before {
  position: absolute;
  inset: 18rpx 36rpx 30rpx;
  border: 2rpx solid rgba($rococo-pink-blue, 0.42);
  border-radius: inherit;
  content: '';
}

.porcelain-shell::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 2rpx;
  height: 100%;
  background: rgba($rococo-gold-rich, 0.22);
  transform: translateX(-50%);
  content: '';
}

.back-row {
  position: relative;
  z-index: 1;
  flex: none;
  padding-top: 18rpx;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 60rpx;
  padding: 0 18rpx;
  color: $rococo-rose;
  font-size: 25rpx;
  line-height: 58rpx;
  background: rgba($rococo-paper, 0.72);
  border: 1rpx solid rgba($rococo-pink-blue, 0.42);
  border-radius: 32rpx 6rpx 32rpx 6rpx;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.88);
  transition:
    color 200ms ease,
    background-color 200ms ease,
    transform 200ms ease;
}

.back-button:active {
  transform: scale(0.98);
}

.login-stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 30rpx 0 64rpx 14rpx;
}

.brand-lockup {
  display: flex;
  flex-direction: column;
  max-width: 84%;
  margin-bottom: 36rpx;
  margin-left: 4rpx;
}

.brand-kicker {
  color: $rococo-gold-rich;
  font-size: 20rpx;
  font-style: italic;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-title {
  margin-top: 12rpx;
  color: $rococo-ink;
  font-family:
    Georgia,
    'Times New Roman',
    'Songti SC',
    serif;
  font-size: 56rpx;
  font-weight: 600;
  line-height: 1.12;
}

.login-card {
  width: calc(100% - 22rpx);
  margin-left: auto;
  padding: 42rpx 34rpx 38rpx;
  overflow: visible;
  background:
    linear-gradient(
      145deg,
      rgba($rococo-porcelain, 0.98),
      rgba($rococo-cream, 0.97) 55%,
      rgba($rococo-pink-blue, 0.24)
    );
  border: 1rpx solid rgba($rococo-gold-rich, 0.36);
  border-radius: 72rpx 10rpx 72rpx 10rpx;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.95),
    inset 0 -4rpx 12rpx rgba($rococo-bright-blue, 0.06),
    0 24rpx 68rpx rgba(146, 94, 121, 0.15);
}

.login-card::before {
  top: -22rpx;
  left: -18rpx;
  width: 92rpx;
  height: 92rpx;
  border-top: 3rpx solid rgba($rococo-gold-rich, 0.52);
  border-left: 3rpx solid rgba($rococo-gold-rich, 0.52);
  border-radius: 64rpx 0 0 0;
}

.login-card::after {
  right: -16rpx;
  bottom: -18rpx;
  width: 108rpx;
  height: 82rpx;
  border-right: 3rpx solid rgba($rococo-gold-rich, 0.52);
  border-bottom: 3rpx solid rgba($rococo-gold-rich, 0.52);
  border-radius: 0 0 60rpx 0;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 26rpx;
}

.field-label {
  margin-bottom: 10rpx;
  color: $rococo-rose;
  font-size: 22rpx;
  font-style: italic;
}

.field-input {
  height: 82rpx;
  padding: 0 24rpx;
  color: $rococo-ink;
  font-size: 27rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba($rococo-pink-blue, 0.62);
  border-bottom-color: rgba($rococo-gold-rich, 0.42);
  border-radius: 34rpx 8rpx 34rpx 8rpx;
  box-shadow: inset 0 2rpx 8rpx rgba($rococo-rose, 0.05);
}

.field-input:focus {
  border-color: rgba($rococo-bright-pink, 0.62);
  box-shadow:
    inset 0 2rpx 8rpx rgba($rococo-rose, 0.06),
    0 0 0 4rpx rgba($rococo-pink-blue, 0.14);
}

.login-button {
  width: 100%;
  height: 88rpx;
  margin-top: 6rpx;
  color: #fffdf9;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 86rpx;
  background: linear-gradient(
    135deg,
    $rococo-rose 0%,
    $rococo-bright-pink 52%,
    $rococo-bright-blue 100%
  );
  border: 1rpx solid rgba($rococo-gold-pale, 0.72);
  border-radius: 44rpx 10rpx 44rpx 10rpx;
  box-shadow:
    0 16rpx 34rpx rgba($rococo-rose, 0.2),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.48);
  transition:
    transform 200ms ease,
    opacity 200ms ease,
    box-shadow 200ms ease;
}

.login-button:active {
  transform: translateY(1rpx) scale(0.988);
}

.login-button[disabled] {
  color: rgba(255, 253, 249, 0.78);
  background: linear-gradient(
    135deg,
    rgba($rococo-gold-pale, 0.92),
    rgba($rococo-pink-blue, 0.82)
  );
  box-shadow: none;
}

.login-footer {
  position: relative;
  z-index: 1;
  flex: none;
  padding: 18rpx 0 0;
}

.ornament-line {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rpx;
}

.ornament-line::before,
.ornament-line::after {
  flex: 1;
  height: 2rpx;
  background: linear-gradient(
    90deg,
    transparent,
    rgba($rococo-gold-rich, 0.46),
    rgba($rococo-pink-blue, 0.38)
  );
  content: '';
}

.ornament-line::after {
  transform: scaleX(-1);
}

.ornament-gem {
  width: 14rpx;
  height: 14rpx;
  margin: 0 14rpx;
  background: $rococo-gold-pale;
  border: 1rpx solid rgba($rococo-gold-rich, 0.55);
  transform: rotate(45deg);
}
</style>
