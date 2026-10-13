import { http } from './request';

import type { UploadedFileInfo } from '@/types';

export interface UploadFileOptions {
  /** 指定保存文件名，不传则使用原始文件名 */
  fileName?: string;
  /** 可选子目录，最终仍会拼在「文件类型/上传日期」之后 */
  storageAddress?: string;
  /** 同名文件直接覆盖，用于「编辑后回写原文件」 */
  overwrite?: boolean;
}

/**
 * POST /files/upload —— 本地文件上传接口。
 * 后端按「文件类型 / 上传日期 / 自定义子目录」归档到本地文件仓，并返回可直接访问的 url。
 */
export function uploadFile(file: File, options: UploadFileOptions = {}): Promise<UploadedFileInfo> {
  const form = new FormData();
  form.append('file', file);
  if (options.fileName) {
    form.append('fileName', options.fileName);
  }
  if (options.storageAddress) {
    form.append('storageAddress', options.storageAddress);
  }
  if (options.overwrite) {
    form.append('overwrite', 'true');
  }
  return http.post<UploadedFileInfo>('/files/upload', form);
}

