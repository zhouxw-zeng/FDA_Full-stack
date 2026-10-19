<script setup lang="ts">
defineOptions({ name: 'ChatPanel' });

const emit = defineEmits<{ friends: [] }>();

function goFriends(): void {
  emit('friends');
}
</script>

<template>
  <view class="chat-panel panel">
    <view class="panel-header">
      <view class="header-copy">
        <text class="eyebrow">Chat</text>
        <view class="title-row">
          <text class="page-title">聊天</text>
          <text class="chat-status">好友会话</text>
        </view>
      </view>
    </view>

    <view class="chat-placeholder">
      <view class="placeholder-mark">
        <app-icon name="comment" :size="56" color="#c76f96" />
      </view>
      <text class="placeholder-title">好友聊天即将上线</text>
      <text class="placeholder-copy">和好友的一对一会话正在建设中。</text>
      <button class="placeholder-button" @tap="goFriends">去好友列表</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
}

.header-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.eyebrow {
  color: $rococo-gold;
  font-size: 20rpx;
  line-height: 1.4;
  text-transform: uppercase;
}

.title-row {
  display: flex;
  align-items: baseline;
  min-width: 0;
  margin-top: 4rpx;
}

.page-title {
  flex: none;
  color: $rococo-ink;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.chat-status {
  margin-left: 12rpx;
  color: $rococo-muted;
  font-size: 22rpx;
}

.chat-placeholder {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 32rpx 48rpx;
  padding: 64rpx 40rpx;
  background: rgba($rococo-paper, 0.92);
  border: 1rpx solid rgba($rococo-gold-rich, 0.24);
  border-radius: 8rpx;
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 16rpx 40rpx rgba(137, 91, 116, 0.08);
}

.placeholder-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(140deg, rgba($rococo-pink-light, 0.72), rgba($rococo-pink-blue, 0.6));
  border: 1rpx solid rgba($rococo-gold-rich, 0.26);
  border-radius: 50%;
}

.placeholder-title {
  margin-top: 28rpx;
  color: $rococo-ink;
  font-size: 32rpx;
  font-weight: 600;
}

.placeholder-copy {
  margin-top: 12rpx;
  color: $rococo-muted;
  font-size: 24rpx;
  line-height: 1.6;
  text-align: center;
}

.placeholder-button {
  min-width: 240rpx;
  height: 76rpx;
  margin-top: 32rpx;
  padding: 0 32rpx;
  color: #fffdfa;
  font-size: 26rpx;
  line-height: 74rpx;
  background: $rococo-rose;
  border-radius: 38rpx;
}
</style>
