import { getAccessToken } from '@/utils/storage';
import type { ApiResponse, AvatarOption, UploadedFileInfo } from '@/types';

import { API_BASE_URL, http } from './request';

export interface UploadFileOptions {
  fileName?: string;
  storageAddress?: string;
}

export function fetchAvatarOptions(): Promise<AvatarOption[]> {
  return http.get<AvatarOption[]>('/mobile-files/avatars');
}

export function resolveFileUrl(url?: string | null): string {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = (import.meta.env.VITE_FILE_BASE_URL || '').replace(/\/+$/, '');
  if (!baseUrl) {
    return url;
  }

  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

export function uploadFile(
  filePath: string,
  options: UploadFileOptions = {},
): Promise<UploadedFileInfo> {
  const token = getAccessToken();

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/mobile-files/upload`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      formData: {
        ...(options.fileName ? { fileName: options.fileName } : {}),
        ...(options.storageAddress ? { storageAddress: options.storageAddress } : {}),
      },
      success: (response) => {
        let body: ApiResponse<UploadedFileInfo> | undefined;

        try {
          body = JSON.parse(response.data) as ApiResponse<UploadedFileInfo>;
        } catch {
          reject(new Error('上传响应解析失败'));
          return;
        }

        if (
          response.statusCode >= 200 &&
          response.statusCode < 300 &&
          body.code === 0
        ) {
          resolve(body.data);
          return;
        }

        reject(new Error(body.message || `上传失败（${response.statusCode}）`));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '上传失败，请稍后重试'));
      },
    });
  });
}
