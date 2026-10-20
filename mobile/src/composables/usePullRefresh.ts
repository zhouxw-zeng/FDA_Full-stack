import { computed, nextTick, ref } from 'vue';

interface PullRefreshOptions {
  threshold?: number;
  onRefresh: () => Promise<void>;
}

interface ScrollEventLike {
  detail?: {
    scrollTop?: number;
  };
}

interface TouchLike {
  clientY?: number;
  pageY?: number;
}

interface TouchEventLike {
  touches?: TouchLike[];
  changedTouches?: TouchLike[];
}

/**
 * 固定在列表顶部的下拉刷新：
 * 下拉超过阈值显示「松手刷新」，松手触发刷新，回拉不足阈值则收起。
 */
export function usePullRefresh(options: PullRefreshOptions) {
  const threshold = options.threshold ?? 72;
  const pullDistance = ref(0);
  const refreshing = ref(false);
  const scrollTop = ref(0);
  const scrollIntoView = ref('');

  const pullText = computed(() => {
    if (refreshing.value) {
      return '正在刷新';
    }
    return pullDistance.value >= threshold ? '松手刷新' : '下拉刷新';
  });

  let startY = 0;
  let tracking = false;

  function touchY(event: TouchEventLike): number {
    const touch = event.touches?.[0] ?? event.changedTouches?.[0];
    return touch?.clientY ?? touch?.pageY ?? 0;
  }

  function onScroll(event: ScrollEventLike): void {
    scrollTop.value = Number(event.detail?.scrollTop ?? 0);
  }

  function onTouchStart(event: TouchEventLike): void {
    if (refreshing.value || scrollTop.value > 0) {
      tracking = false;
      return;
    }

    tracking = true;
    startY = touchY(event);
  }

  function onTouchMove(event: TouchEventLike): void {
    if (!tracking || refreshing.value) {
      return;
    }

    const delta = touchY(event) - startY;
    if (delta <= 0 || scrollTop.value > 0) {
      pullDistance.value = 0;
      return;
    }

    pullDistance.value = Math.min(threshold * 1.4, delta * 0.5);
  }

  async function refresh(): Promise<void> {
    if (refreshing.value) {
      return;
    }

    refreshing.value = true;
    pullDistance.value = threshold;
    try {
      await options.onRefresh();
    } finally {
      refreshing.value = false;
      pullDistance.value = 0;
    }
  }

  async function onTouchEnd(): Promise<void> {
    if (!tracking) {
      return;
    }

    tracking = false;
    if (pullDistance.value >= threshold) {
      await refresh();
      return;
    }

    pullDistance.value = 0;
  }

  /** 重复点击当前 tab：滚回顶部并显示加载状态重新拉取 */
  async function reset(): Promise<void> {
    if (refreshing.value) {
      return;
    }

    pullDistance.value = 0;
    scrollIntoView.value = '';
    await nextTick();
    scrollIntoView.value = 'list-top';
    await refresh();
  }

  return {
    pullDistance,
    refreshing,
    pullText,
    scrollIntoView,
    threshold,
    onScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    reset,
  };
}
