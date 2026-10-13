import type {
  AdPlacement,
  AdStatus,
  AuditStatus,
  Customer,
  SelectOption,
} from '@/types';

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const AUDIT_STATUS_TAG: Record<AuditStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const CUSTOMER_STATUS_LABELS: Record<Customer['status'], string> = {
  pending: '待审批',
  approved: '正常',
  rejected: '已驳回',
  banned: '已封禁',
};

export const CUSTOMER_STATUS_TAG: Record<
  Customer['status'],
  'warning' | 'success' | 'danger' | 'info'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  banned: 'info',
};

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  feed: '信息流',
  banner: '横幅',
  video_pre: '视频前贴',
  splash: '开屏',
};

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  running: '投放中',
  paused: '已暂停',
  ended: '已结束',
  draft: '草稿',
};

export const AD_STATUS_TAG: Record<AdStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  running: 'success',
  paused: 'warning',
  ended: 'info',
  draft: 'danger',
};

export const CUSTOMER_LEVEL_LABELS: Record<Customer['level'], string> = {
  newbie: '新用户',
  active: '活跃',
  veteran: '资深',
};

export const FORUM_CATEGORY_OPTIONS: SelectOption[] = [
  { label: '摄影相册', value: '摄影相册' },
  { label: '短视频', value: '短视频' },
  { label: '器材交流', value: '器材交流' },
  { label: '后期调色', value: '后期调色' },
  { label: '同城活动', value: '同城活动' },
];

export const TOPIC_OPTIONS: SelectOption[] = [
  { label: '今日随手拍', value: '今日随手拍' },
  { label: '城市夜景', value: '城市夜景' },
  { label: '人像写真', value: '人像写真' },
  { label: '航拍视角', value: '航拍视角' },
];

export const AUDIT_STATUS_OPTIONS: SelectOption[] = Object.entries(AUDIT_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const CUSTOMER_STATUS_OPTIONS: SelectOption[] = Object.entries(CUSTOMER_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const CUSTOMER_LEVEL_OPTIONS: SelectOption[] = Object.entries(CUSTOMER_LEVEL_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const AD_PLACEMENT_OPTIONS: SelectOption[] = Object.entries(AD_PLACEMENT_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const AD_STATUS_OPTIONS: SelectOption[] = Object.entries(AD_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);
