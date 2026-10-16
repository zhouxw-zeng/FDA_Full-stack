<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import { fetchForumDynamicDetail } from '@/api/forum';
import { resolveFileUrl } from '@/api/files';
import type { ForumDynamic, ForumMediaItem } from '@/types';

defineOptions({ name: 'DynamicDetail' });

interface CommentItem {
  id: string;
  author: string;
  content: string;
  time: string;
}

const dynamic = ref<ForumDynamic | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const comments: CommentItem[] = [
  {
    id: 'comment-1',
    author: '一池落月',
    content: '这个方便耶，很适合我这种社恐的人。',
    time: '昨天 20:48 · 山东',
  },
  {
    id: 'comment-2',
    author: '猫猫头',
    content: '感觉这个思路可以试试，先收藏了。',
    time: '昨天 20:43 · 广州',
  },
  {
    id: 'comment-3',
    author: '南风知我意',
    content: '拍得很清楚，步骤再展开一点就更好了。',
    time: '昨天 19:56 · 杭州',
  },
];

const title = computed(() => dynamic.value?.title || dynamic.value?.topic || '动态详情');
const mediaList = computed<ForumMediaItem[]>(() => dynamic.value?.media ?? []);
const authorName = computed(() => dynamic.value?.author.nickname || '匿名用户');
const authorAvatar = computed(() => authorName.value.slice(0, 1));
const commentCount = computed(() => dynamic.value?.commentCount ?? comments.length);

function goBack(): void {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/index/index' });
}

function mediaSrc(media: ForumMediaItem): string {
  return resolveFileUrl(media.url);
}

async function loadDetail(id: string): Promise<void> {
  loading.value = true;
  errorMessage.value = '';

  try {
    dynamic.value = await fetchForumDynamicDetail(id);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '动态加载失败';
  } finally {
    loading.value = false;
  }
}

function handleTool(name: string): void {
  uni.showToast({ title: `${name}功能预留中`, icon: 'none' });
}

onLoad((query) => {
  const id = (query as Record<string, string> | undefined)?.id;
  if (!id) {
    errorMessage.value = '缺少动态 ID';
    loading.value = false;
    return;
  }

  void loadDetail(id);
});
</script>

<template>
  <view class="detail-page">
    <view class="detail-nav">
      <button class="back-button" aria-label="返回" @tap="goBack">‹</button>
      <text class="nav-title">动态详情</text>
      <view class="nav-spacer"></view>
    </view>

    <view v-if="loading" class="state-panel">正在加载动态</view>
    <view v-else-if="errorMessage" class="state-panel">{{ errorMessage }}</view>

    <view v-else-if="dynamic" class="detail-content">
      <view class="media-section">
        <video
          v-if="mediaList.length === 1 && mediaList[0].kind === 'video' && mediaList[0].url"
          class="media-single"
          :src="mediaSrc(mediaList[0])"
          controls
          object-fit="cover"
        />
        <image
          v-else-if="mediaList.length === 1 && mediaList[0].url"
          class="media-single"
          :src="mediaSrc(mediaList[0])"
          mode="widthFix"
        />
        <view
          v-else-if="mediaList.length === 1"
          class="media-single media-placeholder"
        >
          <text>{{ mediaList[0].title || dynamic.topic }}</text>
        </view>

        <swiper
          v-else-if="mediaList.length > 1"
          class="media-swiper"
          circular
          indicator-dots
          indicator-color="rgba(255, 255, 255, 0.48)"
          indicator-active-color="#ffffff"
        >
          <swiper-item v-for="media in mediaList" :key="media.id">
            <video
              v-if="media.kind === 'video' && media.url"
              class="media-slide"
              :src="mediaSrc(media)"
              controls
              object-fit="cover"
            />
            <image
              v-else-if="media.url"
              class="media-slide"
              :src="mediaSrc(media)"
              mode="aspectFill"
            />
            <view v-else class="media-slide media-placeholder">
              <text>{{ media.title || dynamic.topic }}</text>
            </view>
          </swiper-item>
        </swiper>

        <view v-else class="media-single media-placeholder">
          <text>{{ dynamic.topic }}</text>
        </view>
      </view>

      <view class="detail-card intro-card">
        <text class="detail-title">{{ title }}</text>
        <text class="detail-text">{{ dynamic.content }}</text>
      </view>

      <view class="detail-card author-card">
        <view class="author-avatar">{{ authorAvatar }}</view>
        <view class="author-copy">
          <text class="author-name">{{ authorName }}</text>
          <text class="author-meta">{{ dynamic.topic }} · {{ dynamic.createdAt }}</text>
        </view>
        <button class="follow-button" @tap="handleTool('关注')">关注</button>
      </view>

      <view class="tool-card">
        <view class="tool-item" @tap="handleTool('点赞')">
          <app-icon name="heart" :size="40" color="#c76f96" />
          <text>{{ dynamic.likeCount }}</text>
        </view>
        <view class="tool-item" @tap="handleTool('评论')">
          <app-icon name="comment" :size="40" color="#7e6c75" />
          <text>{{ dynamic.commentCount }}</text>
        </view>
        <view class="tool-item" @tap="handleTool('收藏')">
          <app-icon name="bookmark" :size="40" color="#b88a45" />
          <text>收藏</text>
        </view>
        <view class="tool-item" @tap="handleTool('分享')">
          <app-icon name="share" :size="40" color="#66b6d9" />
          <text>分享</text>
        </view>
      </view>

      <view class="comment-section">
        <view class="comment-head">
          <text class="comment-title">评论 {{ commentCount }}</text>
          <text class="comment-more">查看全部 ›</text>
        </view>

        <view v-for="comment in comments" :key="comment.id" class="comment-item">
          <view class="comment-avatar">{{ comment.author.slice(0, 1) }}</view>
          <view class="comment-body">
            <text class="comment-author">{{ comment.author }}</text>
            <text class="comment-content">{{ comment.content }}</text>
            <text class="comment-time">{{ comment.time }}</text>
          </view>
          <app-icon name="heart" :size="32" color="#999999" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  background: #f4f5f7;
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 24rpx 12rpx;
}

.back-button {
  width: 64rpx;
  height: 64rpx;
  color: $rococo-ink;
  font-size: 56rpx;
  line-height: 58rpx;
  text-align: center;
  background: transparent;
}

.nav-title {
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

.state-panel {
  padding: 100rpx 32rpx;
  color: $rococo-muted;
  font-size: 26rpx;
  text-align: center;
}

.detail-content {
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

.media-section {
  width: 100%;
  min-height: 360rpx;
  overflow: hidden;
  background: #ffffff;
}

.media-single,
.media-swiper {
  display: block;
  width: 100%;
  height: 720rpx;
}

.media-slide {
  display: block;
  width: 100%;
  height: 720rpx;
}

.media-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a4a3a;
  font-size: 30rpx;
  background: linear-gradient(150deg, #fcecc1, #d9cbc1);
}

.detail-card,
.tool-card,
.comment-section {
  margin: 20rpx 28rpx 0;
  padding: 28rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.03);
}

.detail-title {
  display: block;
  color: #222222;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.4;
}

.detail-text {
  display: block;
  margin-top: 18rpx;
  color: #444444;
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
}

.author-card {
  display: flex;
  align-items: center;
}

.author-avatar,
.comment-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  color: #8a5a44;
  font-weight: 600;
  background: #f5eee8;
}

.author-avatar {
  width: 78rpx;
  height: 78rpx;
  font-size: 30rpx;
  border-radius: 50%;
}

.author-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.author-name {
  overflow: hidden;
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-meta {
  margin-top: 6rpx;
  overflow: hidden;
  color: #999999;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-button {
  flex: none;
  width: 112rpx;
  height: 56rpx;
  color: #c76f96;
  font-size: 23rpx;
  line-height: 54rpx;
  background: #fff8ef;
  border: 1rpx solid rgba(199, 111, 150, 0.42);
  border-radius: 8rpx;
}

.tool-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.tool-item {
  display: flex;
  align-items: center;
  color: #7e6c75;
  font-size: 23rpx;
}

.tool-item text {
  margin-left: 8rpx;
}

.comment-section {
  padding-bottom: 10rpx;
}

.comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.comment-title {
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
}

.comment-more {
  color: #999999;
  font-size: 23rpx;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  font-size: 25rpx;
  border-radius: 50%;
}

.comment-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin: 0 18rpx;
}

.comment-author {
  color: #555555;
  font-size: 25rpx;
  font-weight: 600;
}

.comment-content {
  margin-top: 8rpx;
  color: #333333;
  font-size: 26rpx;
  line-height: 1.5;
}

.comment-time {
  margin-top: 8rpx;
  color: #999999;
  font-size: 21rpx;
}
</style>
