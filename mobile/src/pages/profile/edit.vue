<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { fetchAvatarOptions, resolveFileUrl } from '@/api/files';
import { useUserStore } from '@/stores/user';
import type { AvatarOption, UploadedFileInfo } from '@/types';

defineOptions({ name: 'ProfileEdit' });

const userStore = useUserStore();
const saving = ref(false);
const avatarPanelVisible = ref(false);
const avatarOptions = ref<AvatarOption[]>([]);
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

async function loadAvatarOptions(): Promise<void> {
  try {
    avatarOptions.value = await fetchAvatarOptions();
  } catch {
    avatarOptions.value = [];
  }
}

async function initialize(): Promise<void> {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(goBack, 300);
    return;
  }

  syncForm();
  await Promise.all([
    userStore.loadProfile().catch(() => undefined),
    loadAvatarOptions(),
  ]);
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
  <view class="edit-page rococo-canvas">
    <view class="edit-nav">
      <button class="back-button" aria-label="返回" @tap="goBack">‹</button>
      <text class="edit-title">个人资料</text>
      <view class="nav-spacer"></view>
    </view>

    <scroll-view class="edit-scroll" scroll-y>
      <view class="edit-content">
        <view class="avatar-trigger" @tap="toggleAvatarPanel">
          <image v-if="avatarUrl" class="avatar-image" :src="avatarUrl" mode="aspectFill" />
          <view v-else class="avatar-placeholder">
            {{ userStore.user?.nickname?.slice(0, 1) || '我' }}
          </view>
          <view class="avatar-edit-badge">+</view>
        </view>

        <view class="profile-card rococo-panel">
          <view class="form-row">
            <text class="form-label">姓名</text>
            <input
              v-model="form.nickname"
              class="form-input"
              maxlength="20"
              placeholder="请输入您的姓名"
            />
          </view>

          <view class="form-row">
            <text class="form-label">性别</text>
            <view class="gender-options">
              <view
                v-for="option in [
                  { label: '男', value: 1 },
                  { label: '女', value: 2 },
                ]"
                :key="option.value"
                class="gender-option"
                :class="{ 'gender-option--active': form.gender === option.value }"
                @tap="selectGender(option.value)"
              >
                {{ option.label }}
              </view>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">手机号</text>
            <view class="form-value-row">
              <text class="form-value">{{ maskPhone(userStore.user?.phone) }}</text>
              <text class="form-note">不可修改</text>
            </view>
          </view>

          <view class="form-row">
            <text class="form-label">生日</text>
            <picker mode="date" :value="form.birthday" @change="handleBirthdayChange">
              <view class="form-value-row form-value-row--picker">
                <text class="form-value">
                  {{ form.birthday || '完善生日，不错过惊喜' }}
                </text>
                <text class="form-arrow">›</text>
              </view>
            </picker>
          </view>

          <view class="form-row">
            <text class="form-label">所在城市</text>
            <input
              v-model="form.region"
              class="form-input"
              maxlength="100"
              placeholder="请输入所在城市"
            />
          </view>

          <view class="form-row">
            <text class="form-label">邮箱</text>
            <input
              v-model="form.email"
              class="form-input"
              maxlength="100"
              placeholder="请输入邮箱"
            />
          </view>

          <view class="form-block">
            <text class="form-label">个性签名</text>
            <textarea
              v-model="form.signature"
              class="signature-input"
              maxlength="255"
              placeholder="写一句想说的话"
            />
          </view>
        </view>

        <view v-if="avatarPanelVisible" class="avatar-panel rococo-panel">
          <view class="avatar-panel-head">
            <text class="avatar-panel-title">选择头像</text>
            <text class="avatar-panel-close" @tap="toggleAvatarPanel">收起</text>
          </view>

          <view v-if="avatarOptions.length" class="avatar-grid">
            <view
              v-for="option in avatarOptions"
              :key="option.url"
              class="avatar-option"
              :class="{ 'avatar-option--active': form.avatar === option.url }"
              @tap="selectAvatar(option.url)"
            >
              <image
                class="avatar-option-image"
                :src="resolveFileUrl(option.url)"
                mode="aspectFill"
              />
            </view>
          </view>

          <view class="upload-row">
            <common-upload
              label="上传头像"
              loading-text="上传中"
              storage-address="user/avatar"
              :file-name="`avatar-${userStore.user?.id ?? 'user'}`"
              @success="handleUploadSuccess"
            />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="save-bar">
      <button class="save-button" :disabled="saving" @tap="save">
        {{ saving ? '保存中' : '保存' }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.edit-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
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
  color: $rococo-ink;
  font-size: 56rpx;
  line-height: 58rpx;
  text-align: center;
  background: transparent;
  border: none;
}

.edit-title {
  flex: 1;
  color: $rococo-ink;
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
  min-height: 0;
}

.edit-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 28rpx 36rpx;
  box-sizing: border-box;
}

.avatar-trigger {
  position: relative;
  flex: none;
  width: 132rpx;
  height: 132rpx;
  margin: 0 auto 24rpx;
}

.avatar-image,
.avatar-placeholder {
  display: block;
  width: 132rpx;
  height: 132rpx;
  border: 6rpx solid $rococo-paper;
  border-radius: 16rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 26rpx rgba(137, 91, 116, 0.14);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $rococo-rose;
  font-size: 46rpx;
  font-weight: 600;
  background: $rococo-blush;
}

.avatar-edit-badge {
  position: absolute;
  right: 0;
  bottom: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  color: $rococo-paper;
  font-size: 26rpx;
  line-height: 1;
  background: $rococo-gold-rich;
  border: 4rpx solid $rococo-paper;
  border-radius: 8rpx;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  width: 100%;
  padding: 20rpx 30rpx 12rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92rpx;
  border-bottom: 1rpx solid $rococo-line;
}

.form-label {
  flex: none;
  width: 160rpx;
  color: $rococo-ink;
  font-size: 29rpx;
}

.form-input {
  flex: 1;
  width: auto;
  min-width: 0;
  height: 70rpx;
  color: $rococo-ink;
  font-size: 27rpx;
  text-align: right;
  background: transparent;
  border: none;
}

.form-input::placeholder {
  color: rgba($rococo-muted, 0.62);
}

.form-value-row {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.form-value {
  overflow: hidden;
  color: $rococo-ink;
  font-size: 27rpx;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-value-row--picker .form-value {
  color: $rococo-muted;
}

.form-note {
  flex: none;
  margin-left: 12rpx;
  padding: 6rpx 12rpx;
  color: rgba($rococo-muted, 0.72);
  font-size: 21rpx;
  background: rgba($rococo-pink-blue, 0.16);
  border-radius: 6rpx;
}

.form-arrow {
  flex: none;
  color: $rococo-muted;
  font-size: 38rpx;
  line-height: 1;
}

.gender-options {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}

.gender-option {
  width: 112rpx;
  height: 58rpx;
  color: $rococo-muted;
  font-size: 25rpx;
  line-height: 56rpx;
  text-align: center;
  background: rgba($rococo-paper, 0.78);
  border: 1rpx solid rgba($rococo-muted, 0.24);
  border-radius: 8rpx;
}

.gender-option + .gender-option {
  margin-left: 16rpx;
}

.gender-option--active {
  color: $rococo-rose;
  background: rgba($rococo-blush, 0.58);
  border-color: rgba($rococo-rose, 0.5);
}

.form-block {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24rpx 0 10rpx;
  box-sizing: border-box;
}

.signature-input {
  width: 100%;
  height: 142rpx;
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  color: $rococo-ink;
  font-size: 26rpx;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.5);
  border: 1rpx solid rgba($rococo-pink-blue, 0.42);
  border-radius: 8rpx;
  box-sizing: border-box;
}

.signature-input::placeholder {
  color: rgba($rococo-muted, 0.62);
}

.avatar-panel {
  align-self: stretch;
  width: 100%;
  margin-top: 24rpx;
  padding: 26rpx;
  box-sizing: border-box;
}

.avatar-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.avatar-panel-title {
  color: $rococo-ink;
  font-size: 27rpx;
  font-weight: 600;
}

.avatar-panel-close {
  color: $rococo-rose;
  font-size: 23rpx;
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
  box-sizing: border-box;
  border: 2rpx solid transparent;
  border-radius: 8rpx;
}

.avatar-option--active {
  border-color: $rococo-rose;
  background: rgba($rococo-blush, 0.42);
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
  padding: 16rpx 28rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba($rococo-cream, 0.96);
  border-top: 1rpx solid $rococo-line;
}

.save-button {
  width: 100%;
  height: 88rpx;
  color: #fffdf9;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 86rpx;
  background: linear-gradient(
    135deg,
    $rococo-gold-rich 0%,
    $rococo-rose 54%,
    $rococo-bright-pink 100%
  );
  border: 1rpx solid rgba($rococo-gold-pale, 0.72);
  border-radius: 8rpx;
  box-shadow: 0 14rpx 30rpx rgba($rococo-rose, 0.18);
}

.save-button[disabled] {
  opacity: 0.66;
}
</style>
