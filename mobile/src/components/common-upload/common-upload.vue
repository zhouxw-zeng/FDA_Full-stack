<script setup lang="ts">
import { ref } from 'vue';

import { uploadFile } from '@/api/files';
import type { UploadedFileInfo } from '@/types';

defineOptions({ name: 'CommonUpload' });

const props = withDefaults(
  defineProps<{
    fileName?: string;
    storageAddress?: string;
    label?: string;
    loadingText?: string;
  }>(),
  {
    fileName: '',
    storageAddress: '',
    label: '选择文件',
    loadingText: '上传中',
  },
);

const emit = defineEmits<{
  success: [file: UploadedFileInfo];
  error: [message: string];
}>();

const uploading = ref(false);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '上传失败，请稍后重试';
}

function chooseAndUpload(): void {
  if (uploading.value) {
    return;
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (result) => {
      const filePath = result.tempFilePaths[0];
      if (!filePath) {
        return;
      }

      uploading.value = true;
      try {
        const file = await uploadFile(filePath, {
          fileName: props.fileName || undefined,
          storageAddress: props.storageAddress || undefined,
        });
        emit('success', file);
        uni.showToast({ title: '上传成功', icon: 'success' });
      } catch (error) {
        const message = getErrorMessage(error);
        emit('error', message);
        uni.showToast({ title: message, icon: 'none' });
      } finally {
        uploading.value = false;
      }
    },
  });
}
</script>

<template>
  <button class="common-upload" :disabled="uploading" @tap="chooseAndUpload">
    <text>{{ uploading ? props.loadingText : props.label }}</text>
  </button>
</template>

<style scoped lang="scss">
.common-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 168rpx;
  height: 68rpx;
  padding: 0 24rpx;
  color: $rococo-rose;
  font-size: 24rpx;
  line-height: 66rpx;
  background: rgba($rococo-paper, 0.82);
  border: 1rpx solid rgba($rococo-pink-blue, 0.62);
  border-radius: 32rpx 8rpx 32rpx 8rpx;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.common-upload[disabled] {
  opacity: 0.62;
}
</style>
