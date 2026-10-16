<script setup lang="ts">
import { ref, watch } from 'vue';

import { fetchAvatarOptions, resolveFileUrl } from '@/api/files';
import type { AvatarOption, UploadedFileInfo } from '@/types';

defineOptions({ name: 'AvatarPickerPopup' });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    avatar?: string | null;
    fileName?: string;
  }>(),
  {
    avatar: '',
    fileName: 'avatar',
  },
);

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  select: [url: string];
  uploaded: [file: UploadedFileInfo];
}>();

const avatarOptions = ref<AvatarOption[]>([]);
const loading = ref(false);

async function loadAvatarOptions(): Promise<void> {
  loading.value = true;
  try {
    avatarOptions.value = await fetchAvatarOptions();
  } catch {
    avatarOptions.value = [];
  } finally {
    loading.value = false;
  }
}

function close(): void {
  emit('update:visible', false);
}

function selectAvatar(url: string): void {
  emit('select', url);
  close();
}

function handleUploadSuccess(file: UploadedFileInfo): void {
  emit('uploaded', file);
  close();
}

watch(
  () => props.visible,
  (visible) => {
    if (visible && avatarOptions.value.length === 0) {
      void loadAvatarOptions();
    }
  },
);
</script>

<template>
  <view v-if="visible" class="avatar-popup">
    <view class="avatar-popup-mask" @tap="close"></view>

    <view class="avatar-popup-sheet" @tap.stop>
      <view class="sheet-curve sheet-curve--top"></view>
      <view class="sheet-curve sheet-curve--bottom"></view>

      <view class="sheet-head">
        <view class="sheet-title-group">
          <text class="sheet-kicker">Portrait Atelier</text>
          <text class="sheet-title">选择头像</text>
        </view>
        <button class="sheet-close" @tap="close">×</button>
      </view>

      <view class="upload-entry">
        <view class="upload-preview">
          <image
            v-if="avatar"
            class="upload-preview-image"
            :src="resolveFileUrl(avatar)"
            mode="aspectFill"
          />
          <view v-else class="upload-preview-placeholder">头像</view>
          <view class="upload-preview-shine"></view>
        </view>
        <common-upload
          label="上传图片"
          loading-text="上传中"
          storage-address="user/avatar"
          :file-name="fileName"
          @success="handleUploadSuccess"
        />
      </view>

      <view class="sheet-divider">
        <view class="divider-gem"></view>
      </view>

      <text class="options-title">默认头像</text>

      <scroll-view class="options-scroll" scroll-y>
        <view v-if="loading" class="options-state">正在整理头像</view>
        <view v-else-if="avatarOptions.length === 0" class="options-state">暂无可选头像</view>
        <view v-else class="avatar-grid">
          <view
            v-for="option in avatarOptions"
            :key="option.url"
            class="avatar-option"
            :class="{ 'avatar-option--active': avatar === option.url }"
            @tap="selectAvatar(option.url)"
          >
            <image
              class="avatar-option-image"
              :src="resolveFileUrl(option.url)"
              mode="aspectFill"
            />
            <view v-if="avatar === option.url" class="avatar-selected-mark"></view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.avatar-popup {
  position: fixed;
  inset: 0;
  /* 必须低于 uni.showModal 的 999，避免二次确认框被压在弹窗下面 */
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-popup-mask {
  position: absolute;
  inset: 0;
  background: rgba($rococo-ink, 0.38);
}

.avatar-popup-sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: calc(100% - 48px);
  max-height: 78vh;
  padding: 30rpx 28rpx 32rpx;
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

.sheet-curve {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.sheet-curve--top {
  top: -160rpx;
  right: -140rpx;
  width: 360rpx;
  height: 360rpx;
  border: 2rpx solid rgba($rococo-gold-rich, 0.28);
  border-bottom-color: transparent;
  border-left-color: transparent;
  transform: rotate(20deg);
}

.sheet-curve--bottom {
  bottom: -200rpx;
  left: -160rpx;
  width: 380rpx;
  height: 380rpx;
  border: 2rpx solid rgba($rococo-pink-blue, 0.36);
  border-right-color: transparent;
  border-top-color: transparent;
  transform: rotate(-14deg);
}

.sheet-head,
.upload-entry,
.sheet-divider,
.options-title,
.options-scroll {
  position: relative;
  z-index: 1;
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-right: 72rpx;
}

.sheet-title-group {
  display: flex;
  flex-direction: column;
}

.sheet-kicker {
  color: $rococo-gold-rich;
  font-size: 19rpx;
  font-style: italic;
}

.sheet-title {
  margin-top: 6rpx;
  color: $rococo-ink;
  font-family:
    Georgia,
    'Times New Roman',
    'Songti SC',
    serif;
  font-size: 42rpx;
  font-weight: 600;
}

.sheet-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  color: $rococo-rose;
  font-size: 38rpx;
  line-height: 1;
  text-align: center;
  background: rgba($rococo-paper, 0.74);
  border: 1rpx solid rgba($rococo-pink-blue, 0.44);
  border-radius: 8rpx;
}

.upload-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 26rpx;
}

.upload-preview {
  position: relative;
  width: 156rpx;
  height: 156rpx;
  overflow: hidden;
  background: rgba($rococo-paper, 0.84);
  border: 2rpx solid rgba($rococo-gold-rich, 0.36);
  border-radius: 50%;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.95),
    0 12rpx 30rpx rgba(137, 91, 116, 0.14);
}

.upload-preview-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.upload-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: $rococo-rose;
  font-size: 36rpx;
  font-weight: 600;
  background: $rococo-blush;
  border-radius: 50%;
}

.upload-preview-shine {
  position: absolute;
  top: 12rpx;
  left: 14rpx;
  width: 58rpx;
  height: 2rpx;
  background: rgba(255, 255, 255, 0.78);
  transform: rotate(-18deg);
}

.upload-entry :deep(.common-upload) {
  margin-top: 18rpx;
}

.sheet-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28rpx;
  margin: 24rpx 0 16rpx;
}

.sheet-divider::before,
.sheet-divider::after {
  flex: 1;
  height: 2rpx;
  background: linear-gradient(
    90deg,
    transparent,
    rgba($rococo-gold-rich, 0.42),
    rgba($rococo-pink-blue, 0.34)
  );
  content: '';
}

.sheet-divider::after {
  transform: scaleX(-1);
}

.divider-gem {
  width: 12rpx;
  height: 12rpx;
  margin: 0 14rpx;
  background: $rococo-gold-pale;
  border: 1rpx solid rgba($rococo-gold-rich, 0.5);
  transform: rotate(45deg);
}

.options-title {
  color: $rococo-ink;
  font-size: 25rpx;
  font-weight: 600;
}

.options-scroll {
  max-height: 520rpx;
  margin-top: 18rpx;
}

.options-state {
  padding: 40rpx 0;
  color: $rococo-muted;
  font-size: 24rpx;
  text-align: center;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.avatar-option {
  position: relative;
  width: 23%;
  margin-bottom: 16rpx;
  padding: 6rpx;
  background: rgba($rococo-paper, 0.68);
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  box-sizing: border-box;
}

.avatar-option--active {
  background: rgba($rococo-blush, 0.5);
  border-color: rgba($rococo-rose, 0.62);
  box-shadow: 0 8rpx 20rpx rgba($rococo-rose, 0.12);
}

.avatar-option-image {
  display: block;
  width: 100%;
  height: 118rpx;
  border-radius: 50%;
}

.avatar-selected-mark {
  position: absolute;
  right: 3rpx;
  bottom: 3rpx;
  width: 22rpx;
  height: 22rpx;
  background: $rococo-rose;
  border: 4rpx solid $rococo-paper;
  border-radius: 50%;
}
</style>
