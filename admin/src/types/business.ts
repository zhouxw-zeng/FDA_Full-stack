import type { PageQuery } from './common';

/** 审核状态 */
export type AuditStatus = 'pending' | 'approved' | 'rejected';

/** 媒体类型：相册或视频 */
export type MediaKind = 'album' | 'video';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  /** 占位纹理的种子，前端据此生成确定性缩略图 */
  seed: number;
  duration?: number;
  size: number;
}

/** 论坛信息（需要审批的板块/帖子主体） */
export interface ForumPost {
  id: string;
  title: string;
  summary: string;
  cover: MediaItem;
  category: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  mediaCount: number;
  viewCount: number;
  commentCount: number;
  status: AuditStatus;
  submitAt: string;
  auditAt?: string;
  auditRemark?: string;
  auditor?: string;
  tags: string[];
}

export interface ForumPostQuery extends PageQuery {
  status?: AuditStatus | '';
  category?: string;
}

/** 论坛动态（已发布内容，可删除） */
export interface ForumDynamic {
  id: string;
  content: string;
  media: MediaItem[];
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  topic: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  /** 置顶 / 精选 等运营标记 */
  pinned: boolean;
}

export interface ForumDynamicQuery extends PageQuery {
  topic?: string;
  pinned?: boolean | '';
}

/** C 端用户 */
export interface Customer {
  id: string;
  nickname: string;
  avatar: string;
  phone: string;
  email: string;
  region: string;
  level: 'newbie' | 'active' | 'veteran';
  status: AuditStatus | 'banned';
  registeredAt: string;
  dynamicCount: number;
  auditRemark?: string;
}

export interface CustomerQuery extends PageQuery {
  status?: Customer['status'] | '';
  level?: Customer['level'] | '';
}

/** 广告投放 */
export type AdPlacement = 'feed' | 'banner' | 'video_pre' | 'splash';
export type AdStatus = 'running' | 'paused' | 'ended' | 'draft';

export interface AdCampaign {
  id: string;
  name: string;
  advertiser: string;
  placement: AdPlacement;
  status: AdStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  startAt: string;
  endAt: string;
  seed: number;
}

export interface AdQuery extends PageQuery {
  placement?: AdPlacement | '';
  status?: AdStatus | '';
}

export interface AdCampaignPayload {
  name: string;
  advertiser: string;
  placement: AdPlacement;
  budget: number;
  startAt: string;
  endAt: string;
}

/** 用户行为分析 */
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

/** 工作台概览 */
export interface DashboardOverview {
  pendingPosts: number;
  pendingCustomers: number;
  runningAds: number;
  todayDynamics: number;
  totalUsers: number;
  totalMedia: number;
}

export interface ActivityItem {
  id: string;
  type: 'post' | 'customer' | 'ad' | 'dynamic';
  title: string;
  operator: string;
  createdAt: string;
}
