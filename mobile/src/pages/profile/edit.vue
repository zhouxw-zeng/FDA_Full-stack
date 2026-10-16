<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { resolveFileUrl } from '@/api/files';
import { useUserStore } from '@/stores/user';
import type { UploadedFileInfo } from '@/types';

defineOptions({ name: 'ProfileEdit' });

const userStore = useUserStore();
const saving = ref(false);
const avatarPanelVisible = ref(false);
const avatarUrl = ref('');

const form = reactive({
  nickname: '',
  email: '',
  gender: 0,
  birthday: '',
  region: '',
  signature: '',
  avatar: '',
});

function syncForm(): void {
  const profile = userStore.user;
  form.nickname = profile?.nickname ?? '';
  form.email = profile?.email ?? '';
  form.gender = profile?.gender ?? 0;
  form.birthday = profile?.birthday ?? '';
  form.region = profile?.region ?? '';
  form.signature = profile?.signature ?? '';
  form.avatar = profile?.avatar ?? '';
  avatarUrl.value = resolveFileUrl(form.avatar);
}

async function initialize(): Promise<void> {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(goBack, 300);
    return;
  }

  syncForm();
  await userStore.loadProfile().catch(() => undefined);
  syncForm();
}

function goBack(): void {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/index/index' });
}

function toggleAvatarPanel(): void {
  avatarPanelVisible.value = !avatarPanelVisible.value;
}

function selectAvatar(url: string): void {
  form.avatar = url;
  avatarUrl.value = resolveFileUrl(url);
}

function handleUploadSuccess(file: UploadedFileInfo): void {
  form.avatar = file.url;
  avatarUrl.value = resolveFileUrl(file.url);
}

function selectGender(gender: number): void {
  form.gender = gender;
}

function handleBirthdayChange(event: { detail: { value: string } }): void {
  form.birthday = event.detail.value;
}

function maskPhone(phone?: string): string {
  if (!phone) {
    return '未设置';
  }
  if (phone.length !== 11) {
    return phone;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function validateForm(): string {
  if (!form.nickname.trim()) {
    return '请输入昵称';
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return '请输入正确的邮箱';
  }

  return '';
}

async function save(): Promise<void> {
  const message = validateForm();
  if (message) {
    uni.showToast({ title: message, icon: 'none' });
    return;
  }

  saving.value = true;
  try {
    await userStore.saveProfile({
      nickname: form.nickname.trim(),
      email: form.email.trim() || undefined,
      avatar: form.avatar || undefined,
      gender: form.gender,
      birthday: form.birthday || undefined,
      region: form.region.trim() || undefined,
      signature: form.signature.trim() || undefined,
    });
    uni.showToast({ title: '资料已保存', icon: 'success' });
    setTimeout(goBack, 500);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <view class="edit-page">
    <view class="edit-nav">
      <button class="back-button" aria-label="返回" @tap="goBack">‹</button>
      <text class="edit-title">个人资料</text>
      <view class="nav-spacer"></view>
    </view>

    <scroll-view class="edit-scroll" scroll-y>
      <view class="edit-content">
        <view class="profile-header">
          <view class="avatar-wrap" @tap="toggleAvatarPanel">
            <image
              v-if="avatarUrl"
              class="avatar-image"
              :src="avatarUrl"
              mode="aspectFill"
            />
            <view v-else class="avatar-placeholder">
              {{ userStore.user?.nickname?.slice(0, 1) || '我' }}
            </view>
            <view class="camera-icon"></view>
          </view>
        </view>

        <view class="card-container">
          <view class="form-list">
            <view class="form-item">
              <view class="label-area">
                <text class="label">姓名</text>
              </view>
              <view class="value-area value-area--input">
                <input
                  v-model="form.nickname"
                  class="value-input"
                  maxlength="20"
                  placeholder="请输入您的姓名"
                />
              </view>
            </view>

            <view class="form-item">
              <view class="label-area">
                <text class="label">性别</text>
              </view>
              <view class="value-area">
                <view class="gender-group">
                  <view
                    v-for="option in [
                      { label: '男', value: 1 },
                      { label: '女', value: 2 },
                    ]"
                    :key="option.value"
                    class="gender-btn"
                    :class="{ 'gender-btn--active': form.gender === option.value }"
                    @tap="selectGender(option.value)"
                  >
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <view class="form-item">
              <view class="label-area">
                <text class="label">手机号</text>
              </view>
              <view class="value-area">
                <text>{{ maskPhone(userStore.user?.phone) }}</text>
              </view>
            </view>

            <view class="form-item">
              <view class="label-area">
                <text class="label">生日</text>
                <text class="sub-label">填写完不可修改</text>
              </view>
              <picker
                class="value-picker"
                mode="date"
                :value="form.birthday"
                @change="handleBirthdayChange"
              >
                <view class="value-area">
                  <view v-if="!form.birthday" class="birthday-prompt">
                    完善生日，不错过惊喜
                  </view>
                  <view v-else class="value-text">
                    <text>{{ form.birthday }}</text>
                    <text class="arrow">›</text>
                  </view>
                </view>
              </picker>
            </view>

            <view class="form-item">
              <view class="label-area">
                <text class="label">所在城市</text>
              </view>
              <view class="value-area value-area--input">
                <input
                  v-model="form.region"
                  class="value-input"
                  maxlength="100"
                  placeholder="请输入所在城市"
                />
                <text class="arrow">›</text>
              </view>
            </view>

            <view class="form-item">
              <view class="label-area">
                <text class="label">邮箱</text>
              </view>
              <view class="value-area value-area--input">
                <input
                  v-model="form.email"
                  class="value-input"
                  maxlength="100"
                  placeholder="请输入邮箱"
                />
              </view>
            </view>

            <view class="form-item form-item--block">
              <view class="label-area">
                <text class="label">个性签名</text>
              </view>
              <textarea
                v-model="form.signature"
                class="signature-input"
                maxlength="255"
                placeholder="写一句想说的话"
              />
            </view>
          </view>
        </view>

      </view>
    </scroll-view>

    <view class="save-bar">
      <button class="save-button" :disabled="saving" @tap="save">
        {{ saving ? '保存中' : '保存' }}
      </button>
    </view>

    <avatar-picker-popup
      v-model:visible="avatarPanelVisible"
      :avatar="form.avatar"
      :file-name="`avatar-${userStore.user?.id ?? 'user'}`"
      @select="selectAvatar"
      @uploaded="handleUploadSuccess"
    />
  </view>
</template>

<style scoped lang="scss">
$page-bg: #f4f5f7;
$card-bg: #ffffff;
$text-main: #333333;
$text-sub: #999999;
$border-color: #f0f0f0;
$brand-color: #bca48e;
$brand-bg: #f8f5f1;

.edit-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background: $page-bg;
}

.edit-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 18rpx 24rpx 8rpx;
}

.back-button {
  width: 64rpx;
  height: 64rpx;
  color: $text-main;
  font-size: 56rpx;
  line-height: 58rpx;
  text-align: center;
  background: transparent;
  border: none;
}

.edit-title {
  flex: 1;
  color: $text-main;
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
}

.nav-spacer {
  width: 64rpx;
  height: 64rpx;
}

.edit-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
}

.edit-content {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 100%;
  padding: 0 32rpx 40rpx;
  box-sizing: border-box;
}

.profile-header {
  position: relative;
  z-index: 2;
  display: flex;
  flex: none;
  justify-content: center;
  width: 100%;
  padding-top: 40rpx;
}

.avatar-wrap {
  position: relative;
  box-sizing: border-box;
  width: 176rpx;
  height: 176rpx;
  overflow: visible;
  background: #e53935;
  border: 8rpx solid $card-bg;
  border-radius: 50%;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.avatar-image,
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-image {
  display: block;
}

.avatar-placeholder {
  color: $card-bg;
  font-size: 44rpx;
  font-weight: 600;
}

.camera-icon {
  position: absolute;
  right: -8rpx;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  background: #e0e0e0;
  border: 4rpx solid $card-bg;
  border-radius: 50%;
}

.camera-icon::before {
  width: 20rpx;
  height: 16rpx;
  background: #888888;
  border-radius: 4rpx;
  content: '';
}

.camera-icon::after {
  position: absolute;
  top: 16rpx;
  width: 8rpx;
  height: 8rpx;
  background: #e0e0e0;
  border-radius: 50%;
  content: '';
}

.card-container {
  position: relative;
  z-index: 1;
  flex: none;
  width: 100%;
  margin-top: -90rpx;
  padding-top: 110rpx;
  overflow: hidden;
  background: $card-bg;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.03);
}

.form-list {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 100%;
}

.form-item {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 128rpx;
  padding: 36rpx 40rpx;
  border-bottom: 1rpx solid $border-color;
  box-sizing: border-box;
}

.form-item:last-child {
  border-bottom: none;
}

.label-area {
  display: flex;
  flex: none;
  flex-direction: column;
  justify-content: center;
}

.label {
  color: $text-main;
  font-size: 32rpx;
}

.sub-label {
  margin-top: 8rpx;
  color: $text-sub;
  font-size: 24rpx;
}

.value-area {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  margin-left: 24rpx;
  color: $text-main;
  font-size: 30rpx;
  text-align: right;
}

.value-area--input {
  min-width: 0;
}

.value-input {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  padding: 0;
  color: $text-main;
  font-size: 30rpx;
  text-align: right;
  background: transparent;
  border: none;
}

.value-input::placeholder {
  color: $text-sub;
}

.value-picker {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.value-text {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.gender-group {
  display: flex;
  gap: 24rpx;
}

.gender-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 64rpx;
  color: $text-main;
  font-size: 28rpx;
  background: $card-bg;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
}

.gender-btn--active {
  color: $brand-color;
  background: $brand-bg;
  border-color: $brand-color;
}

.birthday-prompt {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  color: $brand-color;
  font-size: 26rpx;
  background: $brand-bg;
  border-radius: 8rpx;
}

.birthday-prompt::after {
  margin-left: 8rpx;
  font-family: monospace;
  font-size: 32rpx;
  content: '›';
}

.arrow {
  margin-left: 12rpx;
  color: $text-sub;
  font-family: monospace;
  font-size: 32rpx;
}

.form-item--block {
  flex-direction: column;
  align-items: stretch;
}

.signature-input {
  width: 100%;
  height: 160rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  color: $text-main;
  font-size: 28rpx;
  line-height: 1.5;
  background: #fafafa;
  border: 1rpx solid $border-color;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.signature-input::placeholder {
  color: $text-sub;
}

.avatar-panel {
  flex: none;
  width: 100%;
  margin-top: 24rpx;
  padding: 28rpx;
  background: $card-bg;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.avatar-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.avatar-panel-title {
  color: $text-main;
  font-size: 28rpx;
  font-weight: 600;
}

.avatar-panel-close {
  color: $brand-color;
  font-size: 24rpx;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.avatar-option {
  width: 23%;
  margin-bottom: 14rpx;
  padding: 5rpx;
  border: 2rpx solid transparent;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.avatar-option--active {
  border-color: $brand-color;
  background: $brand-bg;
}

.avatar-option-image {
  display: block;
  width: 100%;
  height: 112rpx;
  border-radius: 6rpx;
}

.upload-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
}

.save-bar {
  display: flex;
  flex: none;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: $page-bg;
  border-top: 1rpx solid $border-color;
}

.save-button {
  width: 100%;
  height: 88rpx;
  color: $card-bg;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 86rpx;
  background: $brand-color;
  border: none;
  border-radius: 8rpx;
}

.save-button[disabled] {
  opacity: 0.66;
}
</style>
