import type { PageQuery } from './common';

/** 审核状态，对应后端 audit_status 枚举 */
export type AuditStatus = 'pending' | 'approved' | 'rejected';

/** 启用状态：1 启用，0 下架 / 禁用 */
export type EnabledFlag = 0 | 1;

export type MediaKind = 'album' | 'video';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  /** 占位纹理种子，前端据此生成确定性缩略图 */
  seed: number;
  duration?: number;
  size: number;
}

/** 论坛动态：GET /forum/dynamics */
export interface ForumDynamic {
  id: string;
  content: string;
  media: MediaItem[];
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  typeId: number;
  typeName: string;
  topic: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  pinned: boolean;
  auditStatus: AuditStatus;
  enabled: EnabledFlag;
}

export interface ForumDynamicQuery extends PageQuery {
  topic?: string;
  typeId?: number | '';
  pinned?: boolean | '';
  auditStatus?: AuditStatus | '';
  enabled?: EnabledFlag | '';
}

/** 动态类型：GET /forum/dynamic-types */
export interface ForumDynamicType {
  typeId: number;
  typeName: string;
  typeRemark: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/** 动态变更日志：GET /forum/change-logs */
export interface ForumChangeLog {
  id: string;
  targetType: string;
  targetId: string;
  ownerId: string;
  editorId: string;
  editorType: 'customer' | 'admin';
  action: string;
  changedAt: string;
  remark: string | null;
  attachments: string | null;
}

export interface ForumChangeLogQuery extends PageQuery {
  targetId?: string;
  action?: string;
}

/** C 端用户：GET /customers */
export interface Customer {
  id: string;
  username: string | null;
  nickname: string;
  avatar: string | null;
  phone: string;
  email: string | null;
  gender: number;
  birthday: string | null;
  region: string | null;
  signature: string | null;
  vipLevel: number;
  auditStatus: AuditStatus;
  enabled: EnabledFlag;
  auditRemark: string | null;
  auditedAt: string | null;
  auditedBy: string | null;
  dynamicCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQuery extends PageQuery {
  auditStatus?: AuditStatus | '';
  enabled?: EnabledFlag | '';
  vipLevel?: number | '';
}

/** 广告投放：GET /ads */
export type AdPlacement = 'feed' | 'banner' | 'video_pre' | 'splash';
export type AdStatus = 'running' | 'paused' | 'ended' | 'draft';

export interface AdCampaign {
  id: string;
  name: string;
  advertiser: string;
  partnerTypeId: string | null;
  partnerTypeName: string | null;
  placement: AdPlacement;
  status: AdStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startAt: string;
  endAt: string;
  seed: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdQuery extends PageQuery {
  placement?: AdPlacement | '';
  status?: AdStatus | '';
  partnerTypeId?: number | '';
}

export interface AdCampaignPayload {
  id?: string;
  name: string;
  advertiser: string;
  partnerTypeId?: number;
  placement: AdPlacement;
  budget: number;
  startAt: string;
  endAt: string;
  seed?: number;
}

/** 广告对接方类型：GET /ads/partner-types */
export interface AdPartnerType {
  id: string;
  typeName: string;
  typeCode: string;
  remark: string | null;
  status: number;
  requiresKey: number;
}

/** 用户行为分析：后端暂无对应接口，当前由本地数据提供 */
export interface BehaviorOverview {
  activeUsers: number;
  newUsers: number;
  avgDuration: number;
  retentionRate: number;
  trend: {
    activeUsers: number;
    newUsers: number;
    avgDuration: number;
    retentionRate: number;
  };
}

export interface BehaviorSeries {
  dates: string[];
  activeUsers: number[];
  newUsers: number[];
}

export interface BehaviorFunnelNode {
  name: string;
  value: number;
}

export interface BehaviorDistribution {
  regions: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  hours: { name: string; value: number }[];
}

export interface BehaviorAnalytics {
  overview: BehaviorOverview;
  series: BehaviorSeries;
  funnel: BehaviorFunnelNode[];
  distribution: BehaviorDistribution;
}
