import MockAdapter from 'axios-mock-adapter';

import { httpClient } from '@/api/request';
import type {
  AdCampaign,
  AdCampaignPayload,
  ApiResponse,
  Customer,
  ForumDynamic,
  ForumPost,
  LoginParams,
  LoginResult,
  PageResult,
  UpdateProfilePayload,
  UserProfile,
} from '@/types';

import {
  ADMIN_ACCOUNTS,
  createActivities,
  createAds,
  createBehaviorAnalytics,
  createCustomers,
  createDashboardOverview,
  createForumDynamics,
  createForumPosts,
} from './data';

const TOKEN_PREFIX = 'mock-token';

const db = {
  posts: createForumPosts(),
  dynamics: createForumDynamics(),
  customers: createCustomers(),
  ads: createAds(),
};

function ok<T>(data: T): [number, ApiResponse<T>] {
  return [200, { code: 0, message: 'ok', data }];
}

function fail(status: number, message: string): [number, ApiResponse<null>] {
  return [status, { code: status, message, data: null }];
}

function createToken(username: string): string {
  return `${TOKEN_PREFIX}.${username}.${Date.now()}`;
}

function readUsername(headers?: Record<string, unknown>): string | null {
  const raw = headers?.Authorization ?? headers?.authorization;
  if (typeof raw !== 'string') {
    return null;
  }
  const [, username] = raw.replace('Bearer ', '').split('.');
  return username && username in ADMIN_ACCOUNTS ? username : null;
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

/** 关闭响应体里的类型断言噪音，统一在这里做窄化 */
function body<T>(data: unknown): T {
  return data as T;
}

export function setupMock(): void {
  const mock = new MockAdapter(httpClient, { delayResponse: 260 });

  mock.onPost('/auth/login').reply((config) => {
    const { username, password } = body<LoginParams>(JSON.parse(config.data ?? '{}'));
    const account = ADMIN_ACCOUNTS[username];
    if (!account || account.password !== password) {
      return fail(400, '账号或密码不正确');
    }
    account.profile.lastLoginAt = new Date().toISOString();
    const result: LoginResult = {
      token: createToken(username),
      expiresIn: 7 * 24 * 3600,
      profile: account.profile,
    };
    return ok(result);
  });

  mock.onPost('/auth/logout').reply(() => ok(null));

  mock.onGet('/auth/profile').reply((config) => {
    const username = readUsername(config.headers as Record<string, unknown>);
    if (!username) {
      return fail(401, '登录状态已失效，请重新登录');
    }
    return ok(ADMIN_ACCOUNTS[username]?.profile);
  });

  mock.onPut('/auth/profile').reply((config) => {
    const username = readUsername(config.headers as Record<string, unknown>);
    if (!username) {
      return fail(401, '登录状态已失效，请重新登录');
    }
    const account = ADMIN_ACCOUNTS[username];
    if (!account) {
      return fail(401, '登录状态已失效，请重新登录');
    }
    const payload = body<UpdateProfilePayload>(JSON.parse(config.data ?? '{}'));
    account.profile = { ...account.profile, ...payload };
    return ok<UserProfile>(account.profile);
  });

  mock.onPut('/auth/password').reply((config) => {
    const username = readUsername(config.headers as Record<string, unknown>);
    const account = username ? ADMIN_ACCOUNTS[username] : undefined;
    if (!account) {
      return fail(401, '登录状态已失效，请重新登录');
    }
    const payload = body<{ oldPassword: string; newPassword: string }>(
      JSON.parse(config.data ?? '{}'),
    );
    if (payload.oldPassword !== account.password) {
      return fail(400, '原密码不正确');
    }
    account.password = payload.newPassword;
    return ok(null);
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

  mock.onPut(/\/ads\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const target = db.ads.find((item) => item.id === id);
    if (!target) {
      return fail(404, '广告计划不存在');
    }
    Object.assign(target, body<AdCampaignPayload>(JSON.parse(config.data ?? '{}')));
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

  mock.onAny().reply((config) => {
    console.warn(`[mock] 未匹配到接口: ${config.method?.toUpperCase()} ${config.url}`);
    return fail(404, `Mock 未实现该接口: ${config.url}`);
  });
}
