import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

import type { ApiResponse, LoginResult } from '@/types';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/utils/storage';

export interface RequestConfig extends AxiosRequestConfig {
  /** 关闭全局错误提示，交由调用方自行处理 */
  silent?: boolean;
  /** 跳过 401 自动续期（登录、刷新令牌本身使用） */
  skipAuthRefresh?: boolean;
  /** 内部标记：该请求已经用新 token 重放过一次 */
  retried?: boolean;
}

export const UNAUTHORIZED_EVENT = 'app:unauthorized';

export const httpClient = axios.create({
  baseURL: __API_BASE_URL__,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  // FormData 必须让浏览器自己带 multipart boundary，否则后端无法解析文件
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

/**
 * 用 refreshToken 换新的令牌对。
 * 后端在刷新时会立刻作废旧 refreshToken，因此并发的 401 必须共用同一个刷新请求。
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('本地没有 refreshToken');
  }

  const response = await httpClient.post<ApiResponse<LoginResult>>(
    '/auth/refresh',
    { refreshToken },
    { skipAuthRefresh: true, silent: true } as RequestConfig,
  );

  const body = response.data;
  const data = body.data;
  if (body.code !== 0 || !data?.accessToken) {
    throw new Error(body.message || '刷新登录状态失败');
  }

  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return data.accessToken;
}

function ensureRefresh(): Promise<string> {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function resolveErrorMessage(error: AxiosError<ApiResponse<unknown>>): string {
  if (error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试';
  }
  if (!error.response) {
    return '网络异常，请检查本地服务是否已启动';
  }
  const { status, data } = error.response;
  if (data?.message) {
    return data.message;
  }
  const statusText: Record<number, string> = {
    400: '请求参数有误',
    401: '登录状态已失效，请重新登录',
    403: '没有该操作的权限',
    404: '请求的资源不存在',
    500: '服务端异常，请稍后重试',
  };
  return statusText[status] ?? `请求失败（${status}）`;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const config = error.config as RequestConfig | undefined;

    if (status === 401 && config && !config.skipAuthRefresh && !config.retried) {
      try {
        const accessToken = await ensureRefresh();
        config.retried = true;
        config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${accessToken}` };
        return await httpClient.request(config);
      } catch {
        clearTokens();
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    if (!config?.silent) {
      ElMessage.error(resolveErrorMessage(error));
    }
    return Promise.reject(error);
  },
);

async function request<T>(config: RequestConfig): Promise<T> {
  const response = await httpClient.request<ApiResponse<T>>(config);
  const body = response.data;
  if (body.code !== 0) {
    if (!config.silent) {
      ElMessage.error(body.message || '业务处理失败');
    }
    throw new Error(body.message);
  }
  return body.data;
}

export const http = {
  get: <T>(url: string, params?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'GET', params: sanitizeParams(params) }),
  post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'PUT', data }),
  delete: <T>(url: string, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'DELETE' }),
};

/**
 * 后端的 ValidationPipe 开启了 forbidNonWhitelisted，空字符串会因为不满足
 * `@IsIn` / `@IsInt` 直接 400。这里统一剔除空值，保留 0 与 false 这类有效值。
 */
function sanitizeParams(params?: unknown): Record<string, unknown> | undefined {
  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined,
  );

  return Object.fromEntries(entries);
}
