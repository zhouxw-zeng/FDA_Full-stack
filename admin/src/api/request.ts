import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

import type { ApiResponse } from '@/types';
import { getToken } from '@/utils/storage';

export interface RequestConfig extends AxiosRequestConfig {
  /** 关闭全局错误提示，交由调用方自行处理 */
  silent?: boolean;
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
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const config = error.config as RequestConfig | undefined;
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
    request<T>({ ...config, url, method: 'GET', params }),
  post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'POST', data }),
  put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'PUT', data }),
  delete: <T>(url: string, config?: RequestConfig) =>
    request<T>({ ...config, url, method: 'DELETE' }),
};
