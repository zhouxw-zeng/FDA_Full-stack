import type {
  ActivityItem,
  AdCampaign,
  BehaviorAnalytics,
  Customer,
  DashboardOverview,
  ForumDynamic,
  ForumPost,
  MediaItem,
} from '@/types';

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

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}

function pickInt(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

function isoDaysAgo(days: number, hourOffset = 0): string {
  const base = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(base - hourOffset * 60 * 60 * 1000).toISOString();
}

const NICKNAMES = [
  '光圈旅行者',
  '巷口胶片',
  '暮色快门',
  '阿良的镜头',
  '雾都观测',
  '海盐摄影',
  '南山夜行',
  '拾光笔记',
  '十六号光圈',
  '云上采样',
  'lowercase_lee',
  '慢速快门',
  '半格故事',
  '清晨五点',
  '快门之后',
  '风与取景器',
  '沉底海',
  '北纬三十度',
] as const;

const REGIONS = ['上海', '北京', '杭州', '成都', '广州', '深圳', '南京', '武汉', '西安', '厦门'];

const CATEGORIES = ['摄影相册', '短视频', '器材交流', '后期调色', '同城活动'];

const TITLE_HEADS = ['城市夜色的', '海岸线边的', '雨后的', '清晨的', '老巷里的', '雪山下的'];
const TITLE_TAILS = ['一组随手拍', '光影记录', '四分钟短片', '器材实测', '调色思路分享', '旅行相册'];

const TOPICS = ['今日随手拍', '城市夜景', '人像写真', '航拍视角'];

const DYNAMIC_TEXTS = [
  '昨晚在老码头蹲了两个小时，等到了想要的蓝调时刻，分享几张成片。',
  '第一次尝试用 35mm 扫街，出片率比想象中高，欢迎交流构图。',
  '整理了一份暗调人像的调色参数，需要源文件的评论区留言。',
  '航拍要注意的空域问题，简单列了几条新手最容易踩的坑。',
  '把上周的短片重新剪了一版，节奏比之前紧凑不少。',
  '这支镜头在逆光下的表现超出预期，附上实拍样张。',
];

const ADVERTISERS = ['星野影像器材', '远山户外', '轻旅民宿', '一刻咖啡', '光合相机租赁', '云顶旅行'];
const AD_NAMES = ['秋季器材促销', '城市打卡活动', '会员拉新计划', '品牌年度曝光', '短片征集大赛'];

function createMedia(rng: () => number, index: number): MediaItem {
  const isVideo = rng() > 0.55;
  return {
    id: `M-${index}`,
    kind: isVideo ? 'video' : 'album',
    title: `${pick(rng, TITLE_HEADS)}${pick(rng, TITLE_TAILS)}`,
    seed: pickInt(rng, 1, 9999),
    duration: isVideo ? pickInt(rng, 35, 420) : undefined,
    size: pickInt(rng, 240_000, 18_000_000),
  };
}

export function createForumPosts(): ForumPost[] {
  const rng = createRng(2024);
  return Array.from({ length: 68 }, (_, index) => {
    const statusRoll = rng();
    const status = statusRoll > 0.62 ? 'pending' : statusRoll > 0.24 ? 'approved' : 'rejected';
    const daysAgo = pickInt(rng, 0, 45);
    const nickname = pick(rng, NICKNAMES);
    return {
      id: `P-${2000 + index}`,
      title: `${pick(rng, TITLE_HEADS)}${pick(rng, TITLE_TAILS)}`,
      summary:
        '作者提交了新的论坛信息，包含封面、简介与标签，需要运营同学确认内容合规性与板块归属。',
      cover: createMedia(rng, index),
      category: pick(rng, CATEGORIES),
      author: {
        id: `C-${3000 + index}`,
        nickname,
        avatar: '',
      },
      mediaCount: pickInt(rng, 1, 24),
      viewCount: pickInt(rng, 120, 86_000),
      commentCount: pickInt(rng, 0, 1_200),
      status,
      submitAt: isoDaysAgo(daysAgo, pickInt(rng, 0, 20)),
      auditAt: status === 'pending' ? undefined : isoDaysAgo(Math.max(daysAgo - 1, 0)),
      auditRemark: status === 'rejected' ? '封面与内容不符，请补充原图与拍摄说明。' : undefined,
      auditor: status === 'pending' ? undefined : pick(rng, ['周未眠', '林致远']),
      tags: [pick(rng, TOPICS), pick(rng, CATEGORIES)],
    } satisfies ForumPost;
  });
}

export function createForumDynamics(): ForumDynamic[] {
  const rng = createRng(7788);
  return Array.from({ length: 54 }, (_, index) => {
    const mediaCount = pickInt(rng, 0, 6);
    return {
      id: `D-${5000 + index}`,
      content: pick(rng, DYNAMIC_TEXTS),
      media: Array.from({ length: mediaCount }, (_, mediaIndex) =>
        createMedia(rng, index * 10 + mediaIndex),
      ),
      author: {
        id: `C-${3000 + index}`,
        nickname: pick(rng, NICKNAMES),
        avatar: '',
      },
      topic: pick(rng, TOPICS),
      likeCount: pickInt(rng, 0, 5_600),
      commentCount: pickInt(rng, 0, 480),
      shareCount: pickInt(rng, 0, 260),
      createdAt: isoDaysAgo(pickInt(rng, 0, 30), pickInt(rng, 0, 23)),
      pinned: rng() > 0.86,
    } satisfies ForumDynamic;
  });
}

export function createCustomers(): Customer[] {
  const rng = createRng(9911);
  return Array.from({ length: 96 }, (_, index) => {
    const statusRoll = rng();
    const status: Customer['status'] =
      statusRoll > 0.7
        ? 'pending'
        : statusRoll > 0.2
          ? 'approved'
          : statusRoll > 0.08
            ? 'rejected'
            : 'banned';
    const levelRoll = rng();
    return {
      id: `C-${3000 + index}`,
      nickname: pick(rng, NICKNAMES),
      avatar: '',
      phone: `13${pickInt(rng, 1, 9)}${String(pickInt(rng, 10_000_000, 99_999_999))}`,
      email: `user${3000 + index}@album-forum.dev`,
      region: pick(rng, REGIONS),
      level: levelRoll > 0.66 ? 'veteran' : levelRoll > 0.3 ? 'active' : 'newbie',
      status,
      registeredAt: isoDaysAgo(pickInt(rng, 0, 180), pickInt(rng, 0, 23)),
      dynamicCount: pickInt(rng, 0, 260),
      auditRemark: status === 'rejected' ? '资料不完整，昵称包含违规词。' : undefined,
    } satisfies Customer;
  });
}

export function createAds(): AdCampaign[] {
  const rng = createRng(5150);
  const placements = ['feed', 'banner', 'video_pre', 'splash'] as const;
  const statuses = ['running', 'paused', 'ended', 'draft'] as const;
  return Array.from({ length: 32 }, (_, index) => {
    const budget = pickInt(rng, 5_000, 260_000);
    const status = pick(rng, statuses);
    return {
      id: `A-${7000 + index}`,
      name: `${pick(rng, AD_NAMES)} ${index + 1} 期`,
      advertiser: pick(rng, ADVERTISERS),
      placement: pick(rng, placements),
      status,
      budget,
      spent: Math.round(budget * (status === 'draft' ? 0 : rng() * 0.92)),
      impressions: pickInt(rng, 0, 2_600_000),
      clicks: pickInt(rng, 0, 42_000),
      startAt: isoDaysAgo(pickInt(rng, 1, 40)),
      endAt: isoDaysAgo(-pickInt(rng, 1, 45)),
      seed: pickInt(rng, 1, 9999),
    } satisfies AdCampaign;
  });
}

export function createDashboardOverview(posts: ForumPost[], customers: Customer[]): DashboardOverview {
  return {
    pendingPosts: posts.filter((item) => item.status === 'pending').length,
    pendingCustomers: customers.filter((item) => item.status === 'pending').length,
    runningAds: 9,
    todayDynamics: 126,
    totalUsers: 48_320,
    totalMedia: 216_845,
  };
}

export function createActivities(): ActivityItem[] {
  const rng = createRng(3141);
  const templates: { type: ActivityItem['type']; title: string }[] = [
    { type: 'post', title: '通过了「城市夜色的四分钟短片」' },
    { type: 'customer', title: '审批通过新用户「光圈旅行者」' },
    { type: 'ad', title: '暂停了广告「秋季器材促销 3 期」' },
    { type: 'dynamic', title: '删除了违规动态 D-5021' },
  ];
  return Array.from({ length: 12 }, (_, index) => {
    const template = pick(rng, templates);
    return {
      id: `ACT-${index}`,
      type: template.type,
      title: template.title,
      operator: pick(rng, ['林致远', '周未眠', '苏紫宁']),
      createdAt: isoDaysAgo(pickInt(rng, 0, 6), pickInt(rng, 0, 23)),
    } satisfies ActivityItem;
  });
}

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
