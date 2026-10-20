<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

defineOptions({ name: 'FeedSearch' });

const emit = defineEmits<{
  search: [keyword: string];
  reset: [];
}>();

const expanded = ref(false);
const focused = ref(false);
const keyword = ref('');
const pointerInside = ref(false);
let blurTimer: ReturnType<typeof setTimeout> | null = null;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const lastSearchKeyword = ref('');

function clearBlurTimer(): void {
  if (blurTimer) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
}

function clearSearchTimer(): void {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
}

async function expand(): Promise<void> {
  clearBlurTimer();
  expanded.value = true;
  await nextTick();
  focused.value = true;
}

function collapse(): void {
  clearBlurTimer();
  focused.value = false;
  expanded.value = false;
}

function handleIconTap(): void {
  if (!expanded.value) {
    void expand();
    return;
  }

  submitSearch();
}

function submitSearch(): void {
  clearBlurTimer();
  clearSearchTimer();
  const normalized = keyword.value.trim();
  if (!normalized) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
    return;
  }

  emitSearch(normalized, true);
}

function handleBlur(): void {
  clearBlurTimer();
  blurTimer = setTimeout(() => {
    if (!pointerInside.value) {
      collapse();
    }
  }, 180);
}

function handleMouseEnter(): void {
  pointerInside.value = true;
  clearBlurTimer();
}

function handleMouseLeave(): void {
  pointerInside.value = false;
  collapse();
}

function clearKeyword(): void {
  clearSearchTimer();
  keyword.value = '';
  focused.value = true;
  resetSearch();
}

function emitSearch(value: string, force = false): void {
  if (!value || (!force && value === lastSearchKeyword.value)) {
    return;
  }

  lastSearchKeyword.value = value;
  emit('search', value);
}

function resetSearch(): void {
  if (lastSearchKeyword.value) {
    lastSearchKeyword.value = '';
    emit('reset');
  }
}

watch(keyword, (value) => {
  clearSearchTimer();
  const normalized = value.trim();
  if (!normalized) {
    resetSearch();
    return;
  }

  searchTimer = setTimeout(() => {
    emitSearch(normalized);
  }, 400);
});

onBeforeUnmount(() => {
  clearBlurTimer();
  clearSearchTimer();
});
</script>

<template>
  <view
    class="feed-search"
    :class="{ 'feed-search--expanded': expanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <view class="feed-search__shell">
      <input
        v-model="keyword"
        class="feed-search__input"
        :focus="focused"
        confirm-type="search"
        placeholder="搜索动态标题"
        @blur="handleBlur"
        @confirm="submitSearch"
      />
      <button
        v-if="expanded && keyword"
        class="feed-search__clear"
        aria-label="清除搜索"
        @tap="clearKeyword"
      >
        <app-icon name="close" :size="24" color="#9a8e94" />
      </button>
      <button class="feed-search__button" aria-label="搜索动态" @tap="handleIconTap">
        <app-icon name="search" :size="32" color="#493944" />
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.feed-search {
  position: absolute;
  top: 50%;
  right: 32rpx;
  z-index: 8;
  width: 80rpx;
  transform: translateY(-50%);
  transition: width 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.feed-search--expanded {
  width: calc(100% - 72rpx);
  max-width: 500rpx;
}

.feed-search__shell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 72rpx;
  overflow: hidden;
  background: transparent;
  border: 1rpx solid transparent;
  border-radius: 36rpx;
  box-shadow: none;
  box-sizing: border-box;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.feed-search--expanded .feed-search__shell {
  justify-content: flex-start;
  background: #ffffff;
  border-color: rgba(168, 120, 139, 0.22);
  border-radius: 8px;
  box-shadow: 0 10rpx 28rpx rgba(137, 91, 116, 0.12);
}

.feed-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 6rpx 0 20rpx;
  color: #493944;
  font-size: 25rpx;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease 80ms;
}

.feed-search--expanded .feed-search__input {
  opacity: 1;
  pointer-events: auto;
}

.feed-search__clear,
.feed-search__button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin: 0 7rpx;
  padding: 0;
  background: transparent;
  border-radius: 50%;
}

.feed-search__clear {
  width: 48rpx;
  margin-right: 0;
  border-radius: 6px;
}

.feed-search__button:active,
.feed-search__clear:active {
  background: #f7f1f3;
}
</style>
