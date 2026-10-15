import type { ApiResponse, LoginResult } from '@/types';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setTokens,
  setUser,
} from '@/utils/storage';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  url?: string;
  method?: RequestMethod;
  data?: unknown;
  params?: Record<string, unknown>;
  header?: Record<string, string>;
  silent?: boolean;
  skipAuthRefresh?: boolean;
  retried?: boolean;
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

function buildUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function appendQuery(url: string, params?: Record<string, unknown>): string {
  if (!params) {
    return url;
  }

  const query = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  if (!query) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

function getErrorMessage(statusCode: number, data?: unknown): string {
  const body = data as ApiResponse<unknown> | undefined;
  if (body?.message) {
    return body.message;
  }

  const messages: Record<number, string> = {
    400: '请求参数有误',
    401: '登录状态已失效，请重新登录',
    403: '没有该操作的权限',
    404: '请求的资源不存在',
    500: '服务端异常，请稍后重试',
  };

  return messages[statusCode] ?? `请求失败（${statusCode}）`;
}

function currentRoute(): string {
  const pages = getCurrentPages();
  return pages[pages.length - 1]?.route ?? '';
}

function rawRequest(options: RequestOptions): Promise<UniApp.RequestSuccessCallbackResult> {
  if (!options.url) {
    throw new Error('缺少请求地址');
  }
  const requestUrl = options.url;

  const token = getAccessToken();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header ?? {}),
  };

  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: appendQuery(buildUrl(requestUrl), options.params),
      method: options.method ?? 'GET',
      data: options.data as UniApp.RequestOptions['data'],
      header,
      success: resolve,
      fail: (error) => reject(new Error(error.errMsg || '网络异常，请稍后重试')),
    });
  });
}

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('本地没有 refreshToken');
  }

  const data = await request<LoginResult>({
    url: '/mobile-auth/refresh',
    method: 'POST',
    data: { refreshToken },
    skipAuthRefresh: true,
    silent: true,
  });

  setTokens(data.accessToken, data.refreshToken);
  setUser(data.profile);
  return data.accessToken;
}

function ensureRefresh(): Promise<string> {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(options: RequestOptions): Promise<T> {
  try {
    const response = await rawRequest(options);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      const body = response.data as ApiResponse<T> | undefined;
      if (body && typeof body.code === 'number') {
        if (body.code === 0) {
          return body.data;
        }
        throw new Error(body.message || '业务处理失败');
      }
      return response.data as T;
    }

    if (response.statusCode === 401 && !options.skipAuthRefresh && !options.retried) {
      try {
        await ensureRefresh();
        return await request<T>({ ...options, retried: true });
      } catch {
        clearAuthStorage();
        if (currentRoute() !== 'pages/login/index') {
          uni.reLaunch({ url: '/pages/login/index' });
        }
      }
    }

    if (response.statusCode === 401) {
      clearAuthStorage();
      if (currentRoute() !== 'pages/login/index') {
        uni.reLaunch({ url: '/pages/login/index' });
      }
    }

    throw new Error(getErrorMessage(response.statusCode, response.data));
  } catch (error) {
    if (!options.silent) {
      const message = error instanceof Error ? error.message : '网络异常，请稍后重试';
      uni.showToast({ title: message, icon: 'none' });
    }
    throw error;
  }
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>({ ...options, url, method: 'GET', params }),
  post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ ...options, url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ ...options, url, method: 'PUT', data }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>({ ...options, url, method: 'DELETE' }),
};
