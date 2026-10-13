import type { BehaviorAnalytics } from '@/types';

/** 固定种子的伪随机数：保证每次刷新看到的数据一致，方便对照调试 */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

const REGIONS = ['上海', '北京', '杭州', '成都', '广州', '深圳', '南京', '武汉', '西安', '厦门'];

/**
 * 用户行为分析数据。
 * 后端暂未提供对应统计接口，因此这里按时间范围生成一份稳定的演示数据。
 */
export function createBehaviorAnalytics(range: number): BehaviorAnalytics {
  const rng = createRng(6280 + range);
  const dates: string[] = [];
  const activeUsers: number[] = [];
  const newUsers: number[] = [];
  let activeBase = pickInt(rng, 12_000, 18_000);

  for (let index = range - 1; index >= 0; index -= 1) {
    const date = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
    activeBase = Math.max(4_000, activeBase + pickInt(rng, -1_400, 1_800));
    activeUsers.push(activeBase);
    newUsers.push(pickInt(rng, 600, 2_400));
  }

  const activeTotal = activeUsers.at(-1) ?? 12_000;
  const newTotal = newUsers.at(-1) ?? 1_200;

  return {
    overview: {
      activeUsers: activeTotal,
      newUsers: newTotal,
      avgDuration: pickInt(rng, 320, 640),
      retentionRate: Number((rng() * 18 + 32).toFixed(1)),
      trend: {
        activeUsers: Number((rng() * 16 - 6).toFixed(1)),
        newUsers: Number((rng() * 24 - 8).toFixed(1)),
        avgDuration: Number((rng() * 12 - 4).toFixed(1)),
        retentionRate: Number((rng() * 8 - 3).toFixed(1)),
      },
    },
    series: { dates, activeUsers, newUsers },
    funnel: [
      { name: '打开应用', value: activeTotal },
      { name: '浏览论坛', value: Math.round(activeTotal * 0.72) },
      { name: '查看动态', value: Math.round(activeTotal * 0.54) },
      { name: '互动评论', value: Math.round(activeTotal * 0.21) },
      { name: '发布内容', value: Math.round(activeTotal * 0.08) },
    ],
    distribution: {
      regions: REGIONS.slice(0, 8).map((region) => ({
        name: region,
        value: pickInt(rng, 1_200, 26_000),
      })),
      devices: [
        { name: 'iOS', value: pickInt(rng, 12_000, 30_000) },
        { name: 'Android', value: pickInt(rng, 10_000, 28_000) },
        { name: 'Web', value: pickInt(rng, 2_000, 9_000) },
        { name: 'Pad', value: pickInt(rng, 800, 4_000) },
      ],
      hours: Array.from({ length: 12 }, (_, index) => ({
        name: `${index * 2}:00`,
        value: pickInt(rng, 200, 5_600),
      })),
    },
  };
}

