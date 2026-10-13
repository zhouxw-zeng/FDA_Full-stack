import MockAdapter from 'axios-mock-adapter';

import { httpClient } from '@/api/request';
import type { ApiResponse } from '@/types';

import { createBehaviorAnalytics } from './data';

/**
 * 本地演示数据兜底。
 *
 * 目前只剩「用户行为分析」一个接口：后端尚未提供统计接口，
 * 其余模块（认证、路由、论坛动态、C 端用户、广告）都已对接真实 API。
 *
 * onNoMatch: 'passthrough' 保证没有命中的请求原样发给真实后端。
 */
export function setupBusinessMock(): void {
  const mock = new MockAdapter(httpClient, {
    delayResponse: 200,
    onNoMatch: 'passthrough',
  });

  mock.onGet('/analytics/behavior').reply((config) => {
    const range = Number((config.params as { range?: number } | undefined)?.range ?? 14);
    const body: ApiResponse<ReturnType<typeof createBehaviorAnalytics>> = {
      code: 0,
      message: 'ok',
      data: createBehaviorAnalytics(range),
    };
    return [200, body];
  });
}
