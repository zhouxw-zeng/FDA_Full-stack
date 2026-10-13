import { nextTick, onMounted, ref, watch } from 'vue';

import { useAppStore } from '@/stores/app';

export interface ChartTokens {
  ink: string;
  ink2: string;
  ink3: string;
  border: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  surface: string;
}

const FALLBACK: ChartTokens = {
  ink: '#1b2027',
  ink2: '#4c5563',
  ink3: '#7d8797',
  border: '#e3e6eb',
  primary: '#1f7a6b',
  accent: '#c2681f',
  success: '#2f855a',
  warning: '#b7791f',
  danger: '#c0392b',
  info: '#3a6ea5',
  surface: '#ffffff',
};

/**
 * ECharts 无法直接消费 CSS 变量，这里在运行时读取设计令牌，
 * 主题切换后重新取值，图表配色就能和界面保持一致。
 */
export function useChartTokens() {
  const appStore = useAppStore();
  const tokens = ref<ChartTokens>({ ...FALLBACK });

  function readTokens(): ChartTokens {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    return {
      ink: read('--app-ink', FALLBACK.ink),
      ink2: read('--app-ink-2', FALLBACK.ink2),
      ink3: read('--app-ink-3', FALLBACK.ink3),
      border: read('--app-border', FALLBACK.border),
      primary: read('--app-primary', FALLBACK.primary),
      accent: read('--app-accent', FALLBACK.accent),
      success: read('--app-success', FALLBACK.success),
      warning: read('--app-warning', FALLBACK.warning),
      danger: read('--app-danger', FALLBACK.danger),
      info: read('--app-info', FALLBACK.info),
      surface: read('--app-surface', FALLBACK.surface),
    };
  }

  onMounted(() => {
    tokens.value = readTokens();
  });

  watch(
    () => appStore.theme,
    async () => {
      await nextTick();
      tokens.value = readTokens();
    },
  );

  return tokens;
}

