/** POST /files/upload 返回结构 */
export interface UploadedFileInfo {
  /** 上传时的原始文件名 */
  originalName: string;
  /** 实际落盘文件名（重名会自动追加序号） */
  fileName: string;
  /** 归档类型：image / video / audio / document / archive / other */
  fileType: string;
  /** 归档日期目录，例如 2026-10-13 */
  uploadDate: string;
  mimeType: string;
  size: number;
  /** 服务器本地绝对路径 */
  storageAddress: string;
  /** 相对本地文件根目录的路径 */
  relativePath: string;
  /** 可直接访问的地址，例如 /local-files/document/2026-10-13/xxx.md */
  url: string;
}

