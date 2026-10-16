<script setup lang="ts">
import { computed, ref } from 'vue';

import { AI_ONE_SHOT_MAX_FILES, generateAiCopy } from '@/api/ai';
import { uploadFile } from '@/api/files';
import { createForumDynamic } from '@/api/forum';
import type { ForumMediaItem } from '@/types';

defineOptions({ name: 'DynamicPublish' });

type MediaKind = 'album' | 'video';

interface PickedMedia {
  id: string;
  kind: MediaKind;
  localPath: string;
  title: string;
  size: number;
  duration?: number;
  seed: number;
  url: string;
}

interface ChooseMediaTempFile {
  tempFilePath: string;
  size: number;
  fileType?: string;
  duration?: number;
}

interface ChooseMediaOptions {
  count?: number;
  mediaType?: MediaKind[];
  sourceType?: Array<'album' | 'camera'>;
  success?: (result: { tempFiles: ChooseMediaTempFile[] }) => void;
  fail?: () => void;
}

const MAX_MEDIA = 9;
const AI_PROMPT =
  '请根据上传的图片写一段适合社交动态的中文文案，语气自然口语化，80 字以内，直接输出文案正文，不要解释过程。';

const media = ref<PickedMedia[]>([]);
const title = ref('');
const content = ref('');
const aiLoading = ref(false);
const submitting = ref(false);

const canSubmit = computed(() => content.value.trim().length > 0 && !submitting.value);
const imagePaths = computed(() =>
  media.value
    .filter((item) => item.kind === 'album')
    .map((item) => item.localPath)
    .slice(0, AI_ONE_SHOT_MAX_FILES),
);

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

function pushMedia(file: ChooseMediaTempFile, kind: MediaKind): void {
  if (media.value.length >= MAX_MEDIA) {
    return;
  }

  const filePath = file.tempFilePath;
  const name = filePath.split('/').pop() || `素材${media.value.length + 1}`;

  media.value.push({
    id: `local-${Date.now()}-${media.value.length}`,
    kind,
    localPath: filePath,
    title: name,
    size: file.size ?? 0,
    duration: file.duration,
    seed: hashString(filePath) % 1000,
    url: '',
  });
}

function chooseMedia(): void {
  const remain = MAX_MEDIA - media.value.length;
  if (remain <= 0) {
    uni.showToast({ title: `最多上传 ${MAX_MEDIA} 个素材`, icon: 'none' });
    return;
  }

  const chooseMediaApi = (uni as unknown as { chooseMedia?: (options: ChooseMediaOptions) => void })
    .chooseMedia;

  if (typeof chooseMediaApi === 'function') {
    chooseMediaApi({
      count: remain,
      mediaType: ['album', 'video'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        result.tempFiles.forEach((file) => {
          pushMedia(file, file.fileType === 'video' ? 'video' : 'album');
        });
      },
      fail: () => undefined,
    });
    return;
  }

  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      // 各端 tempFilePaths / tempFiles 的返回类型不一致，这里统一归一化
      const rawPaths = result.tempFilePaths as unknown;
      const paths: string[] = Array.isArray(rawPaths) ? (rawPaths as string[]) : [String(rawPaths)];

      const rawFiles = result.tempFiles as unknown;
      const files: Array<{ size?: number }> = Array.isArray(rawFiles)
        ? (rawFiles as Array<{ size?: number }>)
        : rawFiles
          ? [rawFiles as { size?: number }]
          : [];

      paths.forEach((filePath, index) => {
        pushMedia({ tempFilePath: filePath, size: files[index]?.size ?? 0 }, 'album');
      });
    },
  });
}

function removeMedia(index: number): void {
  media.value.splice(index, 1);
}

async function runAi(): Promise<void> {
  if (aiLoading.value) {
    return;
  }

  const prompt = content.value.trim()
    ? `${AI_PROMPT}\n参考已有内容：${content.value.trim()}`
    : AI_PROMPT;

  if (imagePaths.value.length === 0 && !content.value.trim()) {
    uni.showToast({ title: '请先选择图片或输入内容', icon: 'none' });
    return;
  }

  aiLoading.value = true;
  try {
    const result = await generateAiCopy(imagePaths.value, prompt);
    content.value = result.text?.trim() || content.value;
    uni.showToast({ title: 'AI 文案已生成', icon: 'none' });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : 'AI 生成失败',
      icon: 'none',
    });
  } finally {
    aiLoading.value = false;
  }
}

async function ensureUploaded(): Promise<void> {
  for (const item of media.value) {
    if (item.url) {
      continue;
    }

    const file = await uploadFile(item.localPath, { storageAddress: 'forum/dynamic' });
    item.url = file.url;
    item.title = file.originalName || item.title;
    item.size = file.size ?? item.size;
  }
}

async function submit(): Promise<void> {
  if (!canSubmit.value) {
    return;
  }

  submitting.value = true;
  try {
    await ensureUploaded();

    const payloadMedia: ForumMediaItem[] = media.value.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      url: item.url,
      seed: item.seed,
      duration: item.duration,
      size: item.size,
    }));

    await createForumDynamic({
      title: title.value.trim() || undefined,
      content: content.value.trim(),
      media: payloadMedia,
    });

    uni.showToast({ title: '已提交，等待审核', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 600);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '发布失败，请稍后重试',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function close(): void {
  uni.navigateBack();
}
</script>

<template>
  <view class="publish-page rococo-canvas">
    <view class="publish-nav">
      <button class="nav-close" @tap="close">
        <app-icon name="close" :size="34" color="#493944" />
      </button>
      <text class="nav-title">发动态</text>
      <button class="nav-submit" :disabled="!canSubmit" @tap="submit">
        {{ submitting ? '发布中' : '发布' }}
      </button>
    </view>

    <scroll-view class="publish-scroll" scroll-y :show-scrollbar="false">
      <view class="editor-card">
        <view class="media-grid">
          <view v-for="(item, index) in media" :key="item.id" class="media-cell">
            <image
              v-if="item.kind === 'album'"
              class="media-thumb"
              :src="item.localPath"
              mode="aspectFill"
            />
            <video
              v-else
              class="media-thumb"
              :src="item.localPath"
              :controls="false"
              :show-center-play-btn="true"
              object-fit="cover"
            />
            <view class="media-remove" @tap.stop="removeMedia(index)">
              <app-icon name="close" :size="20" color="#fffdfa" />
            </view>
          </view>

          <view v-if="media.length < MAX_MEDIA" class="media-add" @tap="chooseMedia">
            <text class="media-add-icon">+</text>
            <text class="media-add-title">添加优质</text>
            <text class="media-add-hint">首图更吸引人~</text>
          </view>
        </view>

        <input
          v-model="title"
          class="title-input"
          type="text"
          :maxlength="200"
          placeholder="添加标题（选填）"
        />

        <textarea
          v-model="content"
          class="caption-input"
          :maxlength="5000"
          :auto-height="true"
          placeholder="描述一下这条动态的内容、时间或心情..."
        />

        <view class="editor-foot">
          <text class="ai-hint">AI生成仅供参考</text>
          <button class="ai-button" :disabled="aiLoading" @tap="runAi">
            <app-icon name="sparkles" :size="26" color="#c76f96" />
            <text class="ai-button-text">{{ aiLoading ? '生成中' : 'AI帮你写' }}</text>
          </button>
        </view>
      </view>

      <view class="publish-tip">
        <text>发布后进入待审批状态，审核通过才会展示在首页动态中。</text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.publish-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  overflow: hidden;
  background-color: $rococo-stucco;
}

.publish-nav {
  display: flex;
  flex: none;
  align-items: center;
  height: 96rpx;
  padding: 0 24rpx;
  border-bottom: 1rpx solid $rococo-line;
  background: rgba($rococo-cream, 0.92);
}

.nav-close {
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

.nav-submit {
  flex: none;
  min-width: 132rpx;
  height: 64rpx;
  padding: 0 28rpx;
  color: #fffdfa;
  font-size: 26rpx;
  line-height: 62rpx;
  background: $rococo-rose;
  border-radius: 32rpx;
}

.nav-submit[disabled] {
  color: rgba(255, 253, 250, 0.78);
  background: $rococo-gold-soft;
}

.publish-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  padding: 24rpx;
  box-sizing: border-box;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* #ifdef H5 */
.publish-scroll :deep(.uni-scroll-view) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.publish-scroll :deep(.uni-scroll-view)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */

.editor-card {
  padding: 28rpx;
  background: $rococo-paper;
  border: 1rpx solid rgba($rococo-gold-rich, 0.26);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 16rpx 40rpx rgba(137, 91, 116, 0.1);
}

.media-grid {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.media-cell,
.media-add {
  position: relative;
  width: 31.5%;
  height: 200rpx;
  margin: 0 2.75% 20rpx 0;
  overflow: hidden;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.media-cell:nth-child(3n),
.media-add:nth-child(3n) {
  margin-right: 0;
}

.media-thumb {
  display: block;
  width: 100%;
  height: 100%;
  background: $rococo-stucco;
}

.media-remove {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  background: rgba($rococo-ink, 0.62);
  border-radius: 50%;
}

.media-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 12rpx;
  background: linear-gradient(140deg, rgba($rococo-pink-light, 0.5), rgba($rococo-pink-blue, 0.42));
  border: 2rpx dashed rgba($rococo-gold-rich, 0.4);
  text-align: center;
}

.media-add-icon {
  color: $rococo-rose;
  font-size: 46rpx;
  line-height: 1;
}

.media-add-title {
  margin-top: 10rpx;
  color: $rococo-ink;
  font-size: 23rpx;
}

.media-add-hint {
  margin-top: 4rpx;
  color: $rococo-muted;
  font-size: 20rpx;
}

.title-input {
  width: 100%;
  height: 84rpx;
  margin-top: 8rpx;
  padding: 0 20rpx;
  color: $rococo-ink;
  font-size: 28rpx;
  font-weight: 600;
  background: rgba($rococo-ivory, 0.72);
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.caption-input {
  width: 100%;
  min-height: 260rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  color: $rococo-ink;
  font-size: 27rpx;
  line-height: 1.6;
  background: rgba($rococo-ivory, 0.72);
  border: 1rpx solid $rococo-line;
  border-radius: 8rpx;
  box-sizing: border-box;
  scrollbar-width: none;
}

.caption-input::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
}

.ai-hint {
  flex: 1;
  min-width: 0;
  color: $rococo-muted;
  font-size: 22rpx;
}

.ai-button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  padding: 0 24rpx;
  line-height: 1;
  background: rgba($rococo-pink-light, 0.42);
  border: 1rpx solid rgba($rococo-rose, 0.36);
  border-radius: 32rpx;
}

.ai-button[disabled] {
  opacity: 0.6;
}

.ai-button-text {
  margin-left: 8rpx;
  color: $rococo-rose;
  font-size: 25rpx;
  font-weight: 600;
}

.publish-tip {
  padding: 24rpx 8rpx calc(40rpx + env(safe-area-inset-bottom));
  color: $rococo-muted;
  font-size: 22rpx;
  line-height: 1.6;
  text-align: center;
}
</style>
