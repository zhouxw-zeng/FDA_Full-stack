<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

import UserProfileCard from '@/components/UserProfileCard.vue';
import {
  createForumComment,
  deleteForumComment,
  fetchForumCommentReplies,
  fetchForumComments,
  fetchForumDynamicDetail,
  shareForumDynamic,
  toggleForumDynamicFavorite,
  toggleForumDynamicLike,
} from '@/api/forum';
import { resolveFileUrl } from '@/api/files';
import {
  fetchSocialUser,
  followSocialUser,
  openSocialConversation,
  unfollowSocialUser,
} from '@/api/social';
import { useUserStore } from '@/stores/user';
import {
  getSocialRelationState,
  SOCIAL_RELATION_BUTTON_LABELS,
  type SocialRelationState,
} from '@/utils/social';
import type {
  ForumComment,
  ForumDynamic,
  ForumInteractionInfo,
  ForumMediaItem,
  SocialFollowState,
  SocialUserDetail,
} from '@/types';

defineOptions({ name: 'DynamicDetail' });

type InteractionAction = 'like' | 'favorite' | 'share' | 'comment';
type CommentSort = 'latest' | 'replies' | 'likes';

const commentSortOptions: Array<{ label: string; value: CommentSort }> = [
  { label: '最高点赞', value: 'likes' },
  { label: '最新', value: 'latest' },
  { label: '最多评论', value: 'replies' },
];

const dynamic = ref<ForumDynamic | null>(null);
const userStore = useUserStore();
const comments = ref<ForumComment[]>([]);
const replies = ref<Record<string, ForumComment[]>>({});
const replyTarget = ref<ForumComment | null>(null);
const commentContent = ref('');
const loading = ref(true);
const commentsLoading = ref(false);
const submitting = ref(false);
const loadingReplies = ref<Record<string, boolean>>({});
const busyAction = ref<InteractionAction | null>(null);
const errorMessage = ref('');
const profileVisible = ref(false);
const profileLoading = ref(false);
const profileUser = ref<SocialUserDetail | null>(null);
const authorRelation = ref<SocialRelationState>('none');
const commentsPage = ref(1);
const commentsTotal = ref(0);
const commentsSize = 20;
const commentSort = ref<CommentSort>('likes');

const title = computed(() => dynamic.value?.title || dynamic.value?.topic || '动态详情');
const mediaList = computed<ForumMediaItem[]>(() => dynamic.value?.media ?? []);
const authorName = computed(() => dynamic.value?.author.nickname || '匿名用户');
const authorAvatar = computed(() => authorName.value.slice(0, 1));
const authorAvatarUrl = computed(() => resolveFileUrl(dynamic.value?.author.avatar));
const authorTitle = computed(() => `Lv${dynamic.value?.author.vipLevel ?? 1}`);
const isOwnAuthor = computed(() =>
  Boolean(userStore.user?.id && dynamic.value?.author.id === userStore.user.id),
);
const hasMoreComments = computed(() => comments.value.length < commentsTotal.value);
const commentSortLabels = commentSortOptions.map((option) => option.label);
const commentSortIndex = computed(() =>
  Math.max(
    0,
    commentSortOptions.findIndex((option) => option.value === commentSort.value),
  ),
);
const currentCommentSortLabel = computed(
  () => commentSortOptions[commentSortIndex.value]?.label ?? '最高点赞',
);
const canSubmitComment = computed(
  () => commentContent.value.trim().length > 0 && !submitting.value,
);

function goBack(): void {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/index/index' });
}

function scrollToComments(): void {
  uni.pageScrollTo({ selector: '#comments', duration: 300 });
}

async function handleCommentSortChange(event: { detail: { value: number } }): Promise<void> {
  const option = commentSortOptions[event.detail.value];
  if (!option || option.value === commentSort.value) {
    return;
  }

  commentSort.value = option.value;
  replies.value = {};
  comments.value = [];
  commentsTotal.value = 0;
  commentsPage.value = 1;
  await loadComments(true);
}

function mediaSrc(media: ForumMediaItem): string {
  return resolveFileUrl(media.url);
}

function formatCount(value: number): string {
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(1)}w`;
  }
  return String(value);
}

function formatDateTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function commentAuthor(comment: ForumComment): string {
  return comment.author?.nickname || '已注销用户';
}

function commentAvatar(comment: ForumComment): string {
  return commentAuthor(comment).slice(0, 1);
}

function commentAvatarUrl(comment: ForumComment): string {
  return resolveFileUrl(comment.author?.avatar);
}

function commentTitle(comment: ForumComment): string {
  return `Lv${comment.author?.vipLevel ?? 1}`;
}

function isDynamicAuthor(comment: ForumComment): boolean {
  return Boolean(
    dynamic.value?.author.id && comment.author?.id && dynamic.value.author.id === comment.author.id,
  );
}

function createRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyInteraction(info: ForumInteractionInfo): void {
  if (!dynamic.value) {
    return;
  }

  dynamic.value = {
    ...dynamic.value,
    liked: info.liked,
    favorited: info.favorited,
    likeCount: info.likeCount,
    commentCount: info.commentCount,
    favoriteCount: info.favoriteCount,
    shareCount: info.shareCount,
  };
}

async function loadComments(reset = false): Promise<void> {
  if (!dynamic.value || commentsLoading.value) {
    return;
  }

  commentsLoading.value = true;
  try {
    if (reset) {
      commentsPage.value = 1;
    }

    const result = await fetchForumComments(
      dynamic.value.id,
      commentsPage.value,
      commentsSize,
      commentSort.value,
    );
    comments.value = reset ? result.list : [...comments.value, ...result.list];
    commentsTotal.value = result.total;
    commentsPage.value += 1;
  } finally {
    commentsLoading.value = false;
  }
}

async function loadDetail(id: string): Promise<void> {
  loading.value = true;
  errorMessage.value = '';

  try {
    dynamic.value = await fetchForumDynamicDetail(id);
    await loadAuthorFollowState();
    try {
      await loadComments(true);
    } catch {
      comments.value = [];
      commentsTotal.value = 0;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '动态加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadAuthorFollowState(): Promise<void> {
  if (!dynamic.value || isOwnAuthor.value) {
    authorRelation.value = 'none';
    return;
  }

  try {
    const user = await fetchSocialUser(dynamic.value.author.id);
    authorRelation.value = getSocialRelationState(user);
  } catch {
    authorRelation.value = 'none';
  }
}

async function toggleAuthorFollow(): Promise<void> {
  if (!dynamic.value || isOwnAuthor.value) {
    return;
  }

  const shouldUnfollow = authorRelation.value !== 'none';
  try {
    const state = shouldUnfollow
      ? await unfollowSocialUser(dynamic.value.author.id)
      : await followSocialUser(dynamic.value.author.id);
    authorRelation.value = getSocialRelationState(state);
    if (profileUser.value?.id === dynamic.value.author.id) {
      profileUser.value = {
        ...profileUser.value,
        isFollowing: state.isFollowing,
        isFollowedBy: state.isFollowedBy,
        isMutual: state.isMutual,
        canChat: state.canChat,
      };
    }
    uni.showToast({
      title: shouldUnfollow
        ? '已取消关注'
        : SOCIAL_RELATION_BUTTON_LABELS[getSocialRelationState(state)],
      icon: 'none',
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '操作失败',
      icon: 'none',
    });
  }
}

async function openUserProfile(userId?: string): Promise<void> {
  if (!userId || userId === userStore.user?.id) {
    return;
  }

  profileVisible.value = true;
  profileLoading.value = true;
  profileUser.value = null;
  try {
    profileUser.value = await fetchSocialUser(userId);
  } catch (error) {
    profileVisible.value = false;
    uni.showToast({
      title: error instanceof Error ? error.message : '加载用户资料失败',
      icon: 'none',
    });
  } finally {
    profileLoading.value = false;
  }
}

function handleProfileFollowChange(state: SocialFollowState): void {
  if (dynamic.value && state.targetUserId === dynamic.value.author.id) {
    authorRelation.value = getSocialRelationState(state);
  }
}

async function handleProfileChat(user: SocialUserDetail): Promise<void> {
  try {
    const conversation = await openSocialConversation(user.id);
    profileVisible.value = false;
    uni.navigateTo({
      url: `/pages/social/chat?id=${encodeURIComponent(
        conversation.id,
      )}&userId=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.nickname)}`,
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : '创建会话失败',
      icon: 'none',
    });
  }
}

function handleProfileDynamics(user: SocialUserDetail): void {
  profileVisible.value = false;
  uni.navigateTo({
    url: `/pages/social/dynamics?id=${encodeURIComponent(user.id)}&name=${encodeURIComponent(
      user.nickname,
    )}`,
  });
}

async function handleLike(): Promise<void> {
  if (!dynamic.value || busyAction.value) {
    return;
  }

  const action = dynamic.value.liked ? 'unlike' : 'like';
  busyAction.value = 'like';
  try {
    const info = await toggleForumDynamicLike(dynamic.value.id, action, createRequestId('like'));
    applyInteraction(info);
    uni.showToast({ title: action === 'like' ? '已点赞' : '已取消点赞', icon: 'none' });
  } finally {
    busyAction.value = null;
  }
}

async function handleFavorite(): Promise<void> {
  if (!dynamic.value || busyAction.value) {
    return;
  }

  const action = dynamic.value.favorited ? 'unfavorite' : 'favorite';
  busyAction.value = 'favorite';
  try {
    const info = await toggleForumDynamicFavorite(
      dynamic.value.id,
      action,
      createRequestId('favorite'),
    );
    applyInteraction(info);
    uni.showToast({ title: action === 'favorite' ? '已收藏' : '已取消收藏', icon: 'none' });
  } finally {
    busyAction.value = null;
  }
}

function chooseShareChannel(): Promise<string | null> {
  const channels = ['微信好友', '朋友圈', '复制动态编号'];
  const values = ['wechat', 'moments', 'copy'];

  return new Promise((resolve) => {
    uni.showActionSheet({
      itemList: channels,
      success: ({ tapIndex }) => resolve(values[tapIndex] ?? null),
      fail: () => resolve(null),
    });
  });
}

function copyShareContent(): Promise<void> {
  const value = dynamic.value;
  if (!value) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    uni.setClipboardData({
      data: `${value.content}\n# ${value.topic}\n动态编号：${value.id}`,
      success: () => resolve(),
      fail: () => resolve(),
    });
  });
}

async function handleShare(): Promise<void> {
  if (!dynamic.value || busyAction.value) {
    return;
  }

  const channel = await chooseShareChannel();
  if (!channel) {
    return;
  }

  busyAction.value = 'share';
  try {
    const info = await shareForumDynamic(dynamic.value.id, channel, createRequestId('share'));
    applyInteraction(info);

    if (channel === 'copy') {
      await copyShareContent();
      uni.showToast({ title: '动态内容已复制', icon: 'none' });
    } else {
      uni.showToast({ title: '已记录分享', icon: 'none' });
    }
  } finally {
    busyAction.value = null;
  }
}

function startReply(comment: ForumComment): void {
  if (comment.deleted) {
    return;
  }
  replyTarget.value = comment;
  commentContent.value = '';
}

function cancelReply(): void {
  replyTarget.value = null;
}

async function submitComment(): Promise<void> {
  if (!dynamic.value || !canSubmitComment.value) {
    return;
  }

  const content = commentContent.value.trim();
  const parent = replyTarget.value;
  submitting.value = true;
  busyAction.value = 'comment';

  try {
    const created = await createForumComment({
      dynamicId: dynamic.value.id,
      content,
      parentId: parent?.id,
      requestId: createRequestId('comment'),
    });

    if (parent) {
      const rootId = parent.rootId ?? parent.id;
      replies.value = {
        ...replies.value,
        [rootId]: [...(replies.value[rootId] ?? []), created],
      };
      comments.value = comments.value.map((item) =>
        item.id === rootId ? { ...item, replyCount: item.replyCount + 1 } : item,
      );
    } else {
      comments.value = [created, ...comments.value];
      commentsTotal.value += 1;
    }

    dynamic.value = {
      ...dynamic.value,
      commentCount: dynamic.value.commentCount + 1,
    };
    commentContent.value = '';
    replyTarget.value = null;
    uni.showToast({ title: '评论已发布', icon: 'none' });
  } finally {
    submitting.value = false;
    busyAction.value = null;
  }
}

async function toggleReplies(comment: ForumComment): Promise<void> {
  const rootId = comment.id;
  if (replies.value[rootId]) {
    const nextReplies = { ...replies.value };
    delete nextReplies[rootId];
    replies.value = nextReplies;
    return;
  }

  if (loadingReplies.value[rootId]) {
    return;
  }

  loadingReplies.value = { ...loadingReplies.value, [rootId]: true };
  try {
    const result = await fetchForumCommentReplies(rootId, 1, 20);
    replies.value = { ...replies.value, [rootId]: result.list };
  } finally {
    loadingReplies.value = { ...loadingReplies.value, [rootId]: false };
  }
}

function confirmDelete(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: '删除评论',
      content: '确定删除这条评论吗？',
      confirmText: '确认',
      cancelText: '取消',
      success: ({ confirm }) => resolve(Boolean(confirm)),
      fail: () => resolve(false),
    });
  });
}

async function removeComment(comment: ForumComment): Promise<void> {
  if (!dynamic.value || comment.deleted || busyAction.value) {
    return;
  }

  const confirmed = await confirmDelete();
  if (!confirmed) {
    return;
  }

  busyAction.value = 'comment';
  try {
    const result = await deleteForumComment(comment.id);
    const deletedCount = result.deletedCount ?? 1;

    if (comment.rootId) {
      const rootId = comment.rootId;
      replies.value = {
        ...replies.value,
        [rootId]: (replies.value[rootId] ?? []).filter((item) => item.id !== comment.id),
      };
      comments.value = comments.value.map((item) =>
        item.id === rootId ? { ...item, replyCount: Math.max(0, item.replyCount - 1) } : item,
      );
    } else {
      const nextReplies = { ...replies.value };
      delete nextReplies[comment.id];
      replies.value = nextReplies;
      comments.value = comments.value.filter((item) => item.id !== comment.id);
      commentsTotal.value = Math.max(0, commentsTotal.value - 1);
    }

    dynamic.value = {
      ...dynamic.value,
      commentCount: Math.max(0, dynamic.value.commentCount - deletedCount),
    };
    uni.showToast({ title: '评论已删除', icon: 'none' });
  } finally {
    busyAction.value = null;
  }
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
      <text class="nav-title">{{ title }}</text>
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
        <view v-else-if="mediaList.length === 1" class="media-single media-placeholder">
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
        <image
          v-if="authorAvatarUrl"
          class="author-avatar author-avatar-image"
          :src="authorAvatarUrl"
          mode="aspectFill"
          @tap="openUserProfile(dynamic.author.id)"
        />
        <view v-else class="author-avatar" @tap="openUserProfile(dynamic.author.id)">
          {{ authorAvatar }}
        </view>
        <view class="author-copy">
          <view class="author-name-row">
            <text class="author-name">{{ authorName }}</text>
            <text class="author-title">{{ authorTitle }}</text>
          </view>
          <text class="author-meta">{{ formatDateTime(dynamic.createdAt) }}</text>
        </view>
        <button
          v-if="!isOwnAuthor"
          class="follow-button"
          :class="`follow-button--${authorRelation}`"
          @tap="toggleAuthorFollow"
        >
          {{ SOCIAL_RELATION_BUTTON_LABELS[authorRelation] }}
        </button>
      </view>

      <view class="tool-card">
        <view class="tool-item" :class="{ 'tool-item--active': dynamic.liked }" @tap="handleLike">
          <text v-if="dynamic.liked" class="like-heart-filled">♥</text>
          <app-icon v-else name="heart" :size="40" color="#7e6c75" />
          <text>{{ formatCount(dynamic.likeCount) }}</text>
        </view>
        <view class="tool-item" @tap="scrollToComments">
          <app-icon name="comment" :size="40" color="#7e6c75" />
          <text>{{ formatCount(dynamic.commentCount) }}</text>
        </view>
        <view
          class="tool-item"
          :class="{ 'tool-item--active tool-item--favorite': dynamic.favorited }"
          @tap="handleFavorite"
        >
          <app-icon name="bookmark" :size="40" :color="dynamic.favorited ? '#b88a45' : '#7e6c75'" />
          <text>{{ formatCount(dynamic.favoriteCount) }}</text>
        </view>
        <view class="tool-item" @tap="handleShare">
          <app-icon name="share" :size="40" color="#66b6d9" />
          <text>{{ formatCount(dynamic.shareCount) }}</text>
        </view>
      </view>

      <view id="comments" class="comment-section">
        <view class="comment-head">
          <text class="comment-title">评论 {{ formatCount(dynamic.commentCount) }}</text>
          <picker
            mode="selector"
            :range="commentSortLabels"
            :value="commentSortIndex"
            @change="handleCommentSortChange"
          >
            <view class="comment-sort">
              <text>{{ currentCommentSortLabel }}</text>
              <app-icon name="chevronDown" :size="26" color="#7e6c75" />
            </view>
          </picker>
        </view>

        <view v-if="commentsLoading && comments.length === 0" class="comment-state">
          正在加载评论
        </view>
        <view v-else-if="comments.length === 0" class="comment-state">暂无评论，来说两句吧</view>

        <view v-for="comment in comments" :key="comment.id" class="comment-item">
          <image
            v-if="commentAvatarUrl(comment)"
            class="comment-avatar comment-avatar-image"
            :src="commentAvatarUrl(comment)"
            mode="aspectFill"
            @tap="openUserProfile(comment.author?.id)"
          />
          <view v-else class="comment-avatar" @tap="openUserProfile(comment.author?.id)">
            {{ commentAvatar(comment) }}
          </view>
          <view class="comment-body">
            <view class="comment-author-row">
              <text class="comment-author">{{ commentAuthor(comment) }}</text>
              <text v-if="isDynamicAuthor(comment)" class="comment-author-badge">作者</text>
              <text class="comment-level">{{ commentTitle(comment) }}</text>
            </view>
            <text class="comment-content">
              {{ comment.content || '该评论已删除' }}
            </text>
            <view class="comment-meta-row">
              <text class="comment-time">{{ formatDateTime(comment.createdAt) }}</text>
              <view class="comment-actions">
                <text
                  v-if="!comment.deleted"
                  class="comment-action"
                  @tap.stop="startReply(comment)"
                >
                  回复
                </text>
                <text
                  v-if="comment.isOwn && !comment.deleted"
                  class="comment-action comment-action--danger"
                  @tap.stop="removeComment(comment)"
                >
                  删除
                </text>
              </view>
            </view>

            <view
              v-if="comment.replyCount > 0"
              class="reply-toggle"
              @tap.stop="toggleReplies(comment)"
            >
              <text>
                {{ replies[comment.id] ? '收起回复' : `展开 ${comment.replyCount} 条回复` }}
              </text>
              <app-icon
                class="reply-chevron"
                :name="replies[comment.id] ? 'chevronUp' : 'chevronDown'"
                :size="28"
                color="#8d7782"
              />
            </view>

            <view v-if="replies[comment.id]" class="reply-list">
              <view v-for="reply in replies[comment.id]" :key="reply.id" class="reply-item">
                <image
                  v-if="commentAvatarUrl(reply)"
                  class="reply-avatar reply-avatar-image"
                  :src="commentAvatarUrl(reply)"
                  mode="aspectFill"
                  @tap="openUserProfile(reply.author?.id)"
                />
                <view v-else class="reply-avatar" @tap="openUserProfile(reply.author?.id)">
                  {{ commentAvatar(reply) }}
                </view>
                <view class="reply-body">
                  <view class="comment-author-row">
                    <text class="comment-author">{{ commentAuthor(reply) }}</text>
                    <text v-if="isDynamicAuthor(reply)" class="comment-author-badge">作者</text>
                    <text class="comment-level">{{ commentTitle(reply) }}</text>
                  </view>
                  <text class="reply-content">{{ reply.content || '该评论已删除' }}</text>
                  <text class="comment-time">{{ formatDateTime(reply.createdAt) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="hasMoreComments" class="comment-more" @tap="loadComments()">查看更多 ›</view>

        <view class="comment-composer">
          <view v-if="replyTarget" class="reply-target">
            <text>正在回复 @{{ commentAuthor(replyTarget) }}</text>
            <text class="reply-target__cancel" @tap="cancelReply">取消</text>
          </view>
          <textarea
            v-model="commentContent"
            class="comment-input"
            :placeholder="replyTarget ? `回复 @${commentAuthor(replyTarget)}` : '说说你的想法...'"
            maxlength="500"
            :auto-height="true"
          />
          <view class="composer-footer">
            <text class="composer-tip">友善交流，理性表达</text>
            <button class="comment-submit" :disabled="!canSubmitComment" @tap="submitComment">
              {{ submitting ? '发布中' : '发布' }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <UserProfileCard
      v-model:visible="profileVisible"
      :user="profileUser"
      :loading="profileLoading"
      @follow-change="handleProfileFollowChange"
      @chat="handleProfileChat"
      @dynamics="handleProfileDynamics"
    />
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
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 24rpx 12rpx;
  background: rgba(244, 245, 247, 0.96);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
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

.nav-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: $rococo-ink;
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.author-avatar-image,
.comment-avatar-image,
.reply-avatar-image {
  display: block;
  background: #f5eee8;
}

.author-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 18rpx;
}

.author-name-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.author-name {
  overflow: hidden;
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-title {
  flex: none;
  margin-left: 10rpx;
  padding: 2rpx 8rpx;
  color: #c76f96;
  font-size: 18rpx;
  line-height: 1.4;
  background: rgba(245, 205, 217, 0.48);
  border-radius: 5rpx;
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
  color: #fffdfa;
  font-size: 23rpx;
  line-height: 54rpx;
  background: linear-gradient(
    135deg,
    $rococo-bright-pink 0%,
    $rococo-rose 58%,
    $rococo-bright-pink 100%
  );
  border: 1rpx solid rgba($rococo-gold-pale, 0.72);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    0 6rpx 14rpx rgba($rococo-rose, 0.2),
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

.tool-item--active {
  color: #c76f96;
}

.tool-item--favorite {
  color: #b88a45;
}

.tool-item .like-heart-filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  margin-left: 0;
  color: #ff3b30;
  font-size: 40rpx;
  line-height: 1;
}

.tool-item text {
  margin-left: 8rpx;
}

.comment-section {
  padding-bottom: 0;
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
  display: block;
  padding: 18rpx 0;
  color: #999999;
  font-size: 23rpx;
  text-align: center;
}

.comment-sort {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 128rpx;
  height: 54rpx;
  padding: 0 14rpx;
  color: #7e6c75;
  font-size: 23rpx;
  background: #faf8f8;
  border: 1rpx solid #f0ecec;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.comment-sort text {
  margin-right: 6rpx;
}

.comment-state {
  padding: 28rpx 0;
  color: #999999;
  font-size: 25rpx;
  text-align: center;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
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
  margin-left: 18rpx;
}

.comment-author-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.comment-author {
  color: #555555;
  font-size: 25rpx;
  font-weight: 600;
}

.comment-level {
  flex: none;
  margin-left: 10rpx;
  padding: 2rpx 8rpx;
  color: #c76f96;
  font-size: 18rpx;
  line-height: 1.4;
  background: rgba(245, 205, 217, 0.48);
  border-radius: 5rpx;
}

.comment-author-badge {
  flex: none;
  margin-left: 10rpx;
  padding: 2rpx 8rpx;
  color: #b88a45;
  font-size: 18rpx;
  line-height: 1.4;
  background: rgba(234, 216, 168, 0.42);
  border-radius: 5rpx;
}

.comment-content {
  margin-top: 8rpx;
  color: #333333;
  font-size: 26rpx;
  line-height: 1.5;
  word-break: break-word;
}

.comment-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.comment-time {
  color: #999999;
  font-size: 21rpx;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.comment-action {
  color: #7e6c75;
  font-size: 22rpx;
}

.comment-action--danger {
  color: #c76f96;
}

.reply-toggle {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  color: #8d7782;
  font-size: 22rpx;
}

.reply-chevron {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  margin-left: 6rpx;
  line-height: 1;
}

.reply-list {
  margin-top: 12rpx;
  padding: 4rpx 18rpx 4rpx 20rpx;
  background: #faf8f8;
  border-left: 4rpx solid #ead8a8;
  border-radius: 0 8rpx 8rpx 0;
}

.reply-item {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
}

.reply-item + .reply-item {
  border-top: 1rpx solid #f0ecec;
}

.reply-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  color: #8a5a44;
  font-size: 21rpx;
  font-weight: 600;
  background: #f5eee8;
  border-radius: 50%;
}

.reply-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 14rpx;
}

.reply-content {
  margin-top: 5rpx;
  color: #444444;
  font-size: 24rpx;
  line-height: 1.45;
}

.reply-item .comment-time {
  margin-top: 5rpx;
}

.comment-composer {
  padding: 24rpx 0 28rpx;
  border-top: 1rpx solid #f0f0f0;
}

.reply-target {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
  color: #8d7782;
  font-size: 23rpx;
}

.reply-target__cancel {
  color: #c76f96;
}

.comment-input {
  display: block;
  width: 100%;
  min-height: 136rpx;
  padding: 18rpx;
  color: #333333;
  font-size: 26rpx;
  line-height: 1.55;
  background: #faf8f8;
  border: 1rpx solid #eee7e7;
  border-radius: 10rpx;
  box-sizing: border-box;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.composer-tip {
  color: #a59a9a;
  font-size: 21rpx;
}

.comment-submit {
  width: 132rpx;
  height: 58rpx;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 58rpx;
  background: #c76f96;
  border-radius: 8rpx;
}

.comment-submit[disabled] {
  color: #b7aeb2;
  background: #eee9eb;
}
</style>
