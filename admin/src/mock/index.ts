import MockAdapter from 'axios-mock-adapter';

import { httpClient } from '@/api/request';
import type {
  AdCampaign,
  AdCampaignPayload,
  ApiResponse,
  Customer,
  ForumDynamic,
  ForumPost,
  PageResult,
} from '@/types';

import {
  createActivities,
  createAds,
  createBehaviorAnalytics,
  createCustomers,
  createDashboardOverview,
  createForumDynamics,
  createForumPosts,
} from './data';

/**
 * 后端目前只实现了 auth / roles / routes / users 四个模块，
 * 论坛、客户、广告、分析这些页面还没有真实接口，因此在开发环境用本地数据兜底。
 *
 * 注意 onNoMatch: 'passthrough' —— 没有命中的请求会原样发给真实后端，
 * 所以登录、刷新令牌、路由树这些请求不会被 mock 拦截。
 */
function ok<T>(data: T): [number, ApiResponse<T>] {
  return [200, { code: 0, message: 'ok', data }];
}

function fail(status: number, message: string): [number, ApiResponse<null>] {
  return [status, { code: status, message, data: null }];
}

function paginate<T>(list: T[], page = 1, pageSize = 10): PageResult<T> {
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

function includesKeyword(source: string, keyword?: string): boolean {
  if (!keyword) {
    return true;
  }
  return source.toLowerCase().includes(keyword.trim().toLowerCase());
}

function body<T>(data: unknown): T {
  return data as T;
}

export function setupBusinessMock(): void {
  const db = {
    posts: createForumPosts(),
    dynamics: createForumDynamics(),
    customers: createCustomers(),
    ads: createAds(),
  };

  const mock = new MockAdapter(httpClient, {
    delayResponse: 260,
    onNoMatch: 'passthrough',
  });

  mock.onGet('/forum/posts').reply((config) => {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status,
      category,
    } = body<{
      page?: number;
      pageSize?: number;
      keyword?: string;
      status?: string;
      category?: string;
    }>(config.params ?? {});

    const filtered = db.posts.filter((item) => {
      if (status && item.status !== status) {
        return false;
      }
      if (category && item.category !== category) {
        return false;
      }
      return includesKeyword(`${item.title}${item.author.nickname}${item.id}`, keyword);
    });
    return ok<PageResult<ForumPost>>(paginate(filtered, page, pageSize));
  });

  mock.onPost(/\/forum\/posts\/[^/]+\/audit/).reply((config) => {
    const id = config.url?.split('/')[3];
    const target = db.posts.find((item) => item.id === id);
    if (!target) {
      return fail(404, '该论坛信息不存在');
    }
    const { status, remark } = body<{ status: ForumPost['status']; remark?: string }>(
      JSON.parse(config.data ?? '{}'),
    );
    target.status = status;
    target.auditAt = new Date().toISOString();
    target.auditRemark = remark;
    target.auditor = '林致远';
    return ok(null);
  });

  mock.onGet('/forum/dynamics').reply((config) => {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      topic,
      pinned,
    } = body<{
      page?: number;
      pageSize?: number;
      keyword?: string;
      topic?: string;
      pinned?: boolean | string;
    }>(config.params ?? {});

    const filtered = db.dynamics.filter((item) => {
      if (topic && item.topic !== topic) {
        return false;
      }
      if (
        pinned !== undefined &&
        pinned !== '' &&
        item.pinned !== (pinned === true || pinned === 'true')
      ) {
        return false;
      }
      return includesKeyword(`${item.content}${item.author.nickname}${item.id}`, keyword);
    });
    return ok<PageResult<ForumDynamic>>(paginate(filtered, page, pageSize));
  });

  mock.onGet(/\/forum\/dynamics\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const target = db.dynamics.find((item) => item.id === id);
    return target ? ok<ForumDynamic>(target) : fail(404, '动态不存在');
  });

  mock.onDelete(/\/forum\/dynamics\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = db.dynamics.findIndex((item) => item.id === id);
    if (index < 0) {
      return fail(404, '动态不存在或已被删除');
    }
    db.dynamics.splice(index, 1);
    return ok(null);
  });

  mock
    .onGet('/forum/media/preview')
    .reply(() => ok(db.dynamics.flatMap((item) => item.media).slice(0, 24)));

  mock.onGet('/customers').reply((config) => {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status,
      level,
    } = body<{
      page?: number;
      pageSize?: number;
      keyword?: string;
      status?: string;
      level?: string;
    }>(config.params ?? {});

    const filtered = db.customers.filter((item) => {
      if (status && item.status !== status) {
        return false;
      }
      if (level && item.level !== level) {
        return false;
      }
      return includesKeyword(`${item.nickname}${item.phone}${item.email}${item.id}`, keyword);
    });
    return ok<PageResult<Customer>>(paginate(filtered, page, pageSize));
  });

  mock.onPost(/\/customers\/[^/]+\/audit/).reply((config) => {
    const id = config.url?.split('/')[2];
    const target = db.customers.find((item) => item.id === id);
    if (!target) {
      return fail(404, '用户不存在');
    }
    const { status, remark } = body<{ status: Customer['status']; remark?: string }>(
      JSON.parse(config.data ?? '{}'),
    );
    target.status = status;
    target.auditRemark = remark;
    return ok(null);
  });

  mock.onGet('/ads').reply((config) => {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      placement,
      status,
    } = body<{
      page?: number;
      pageSize?: number;
      keyword?: string;
      placement?: string;
      status?: string;
    }>(config.params ?? {});

    const filtered = db.ads.filter((item) => {
      if (placement && item.placement !== placement) {
        return false;
      }
      if (status && item.status !== status) {
        return false;
      }
      return includesKeyword(`${item.name}${item.advertiser}${item.id}`, keyword);
    });
    return ok<PageResult<AdCampaign>>(paginate(filtered, page, pageSize));
  });

  mock.onPost('/ads').reply((config) => {
    const payload = body<AdCampaignPayload>(JSON.parse(config.data ?? '{}'));
    const created: AdCampaign = {
      id: `A-${8000 + db.ads.length}`,
      ...payload,
      status: 'draft',
      spent: 0,
      impressions: 0,
      clicks: 0,
      seed: Math.floor(Math.random() * 9999) + 1,
    };
    db.ads.unshift(created);
    return ok(created);
  });

  mock.onPut('/ads/status').reply((config) => {
    const { id, status } = body<{ id: string; status: AdCampaign['status'] }>(
      JSON.parse(config.data ?? '{}'),
    );
    const target = db.ads.find((item) => item.id === id);
    if (!target) {
      return fail(404, '广告计划不存在');
    }
    target.status = status;
    return ok(null);
  });

  mock.onPut('/ads').reply((config) => {
    const { id, ...payload } = body<AdCampaignPayload & { id: string }>(
      JSON.parse(config.data ?? '{}'),
    );
    const target = db.ads.find((item) => item.id === id);
    if (!target) {
      return fail(404, '广告计划不存在');
    }
    Object.assign(target, payload);
    return ok(target);
  });

  mock.onDelete(/\/ads\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = db.ads.findIndex((item) => item.id === id);
    if (index < 0) {
      return fail(404, '广告计划不存在');
    }
    db.ads.splice(index, 1);
    return ok(null);
  });

  mock
    .onGet('/dashboard/overview')
    .reply(() => ok(createDashboardOverview(db.posts, db.customers)));

  mock.onGet('/dashboard/activities').reply(() => ok(createActivities()));

  mock.onGet('/analytics/behavior').reply((config) => {
    const range = Number((config.params as { range?: number } | undefined)?.range ?? 14);
    return ok(createBehaviorAnalytics(range));
  });
}
