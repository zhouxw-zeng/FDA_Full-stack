import type {
  AdPlacement,
  AdStatus,
  AuditStatus,
  EnabledFlag,
  SelectOption,
} from '@/types';

/** 审核状态：论坛动态与 C 端用户共用同一套枚举 */
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

/** 论坛动态启用状态：1 展示中，0 已下架 */
export const FORUM_ENABLED_LABELS: Record<string, string> = {
  1: '展示中',
  0: '已下架',
};

export const FORUM_ENABLED_TAG: Record<string, 'success' | 'info'> = {
  1: 'success',
  0: 'info',
};

/** C 端用户启用状态：1 正常，0 已禁用 */
export const CUSTOMER_ENABLED_LABELS: Record<string, string> = {
  1: '正常',
  0: '已禁用',
};

export const CUSTOMER_ENABLED_TAG: Record<string, 'success' | 'danger'> = {
  1: 'success',
  0: 'danger',
};

export const VIP_LEVEL_LABELS: Record<number, string> = {
  1: 'VIP1',
  2: 'VIP2',
  3: 'VIP3',
  4: 'VIP4',
  5: 'VIP5',
};

export const GENDER_LABELS: Record<number, string> = {
  0: '未知',
  1: '男',
  2: '女',
};

/** AI 模型状态：0 启用，1 禁用（注意与 enabled 语义相反） */
export const MODEL_STATUS_LABELS: Record<string, string> = {
  0: '已启用',
  1: '已禁用',
};

export const MODEL_STATUS_TAG: Record<string, 'success' | 'info'> = {
  0: 'success',
  1: 'info',
};

export const MODEL_STATUS_OPTIONS: SelectOption<number>[] = [
  { label: '已启用', value: 0 },
  { label: '已禁用', value: 1 },
];

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

/** 变更日志动作：论坛动态的审批 / 编辑 / 上下架 */
export const CHANGE_ACTION_LABELS: Record<string, string> = {
  create: '创建',
  audit: '审批',
  edit: '编辑',
  remark: '备注',
  enable: '启用',
  offline: '下架',
};

export const AUDIT_STATUS_OPTIONS: SelectOption[] = Object.entries(AUDIT_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const VIP_LEVEL_OPTIONS: SelectOption<number>[] = Object.entries(VIP_LEVEL_LABELS).map(
  ([value, label]) => ({ label, value: Number(value) }),
);

export const AD_PLACEMENT_OPTIONS: SelectOption[] = Object.entries(AD_PLACEMENT_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const AD_STATUS_OPTIONS: SelectOption[] = Object.entries(AD_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);

export const ENABLED_OPTIONS: SelectOption<number>[] = [
  { label: '已启用', value: 1 satisfies EnabledFlag },
  { label: '已停用', value: 0 satisfies EnabledFlag },
];

