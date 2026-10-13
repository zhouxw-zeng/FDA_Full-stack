import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface UploadedLocalFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
]);
const ARCHIVE_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']);

@Injectable()
export class FilesService {
  private readonly rootDirectory: string;
  private readonly urlPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.rootDirectory = path.resolve(
      this.configService.get<string>('LOCAL_FILE_ROOT', 'E:\\ZXW\\local_file'),
    );
    this.urlPrefix =
      this.configService.get<string>('LOCAL_FILE_URL_PREFIX', '/local-files').replace(/\/+$/, '') ||
      '/local-files';
  }

  async uploadFile(
    file: UploadedLocalFile | undefined,
    fileName?: string,
    storageAddress?: string,
    overwrite = false,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('文件不能超过 50MB');
    }

    const fileType = this.resolveFileType(file);
    const uploadDate = this.getUploadDate();
    const safeFileName = this.resolveFileName(file, fileName);
    const subDirectories = this.parseStorageAddress(storageAddress);
    const targetDirectory = path.resolve(
      this.rootDirectory,
      fileType,
      uploadDate,
      ...subDirectories,
    );

    this.assertInsideRoot(targetDirectory);
    await fs.mkdir(targetDirectory, { recursive: true });

    // 覆盖模式用于「编辑后保存」这类场景：路径保持稳定，直接写回原文件
    const targetPath = overwrite
      ? path.join(targetDirectory, safeFileName)
      : await this.resolveUniqueFilePath(targetDirectory, safeFileName);
    await fs.writeFile(targetPath, file.buffer);

    const relativePath = path.relative(this.rootDirectory, targetPath);
    return {
      originalName: file.originalname,
      fileName: path.basename(targetPath),
      fileType,
      uploadDate,
      mimeType: file.mimetype,
      size: file.size,
      storageAddress: targetPath,
      relativePath,
      url: `${this.urlPrefix}/${this.toUrlPath(relativePath)}`,
    };
  }

  private resolveFileType(file: UploadedLocalFile): string {
    const mimeType = file.mimetype.toLowerCase();
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (DOCUMENT_EXTENSIONS.has(extension)) {
      return 'document';
    }
    if (ARCHIVE_EXTENSIONS.has(extension)) {
      return 'archive';
    }

    return 'other';
  }

  private getUploadDate(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private resolveFileName(file: UploadedLocalFile, fileName?: string): string {
    const requestedName = (fileName?.trim() || file.originalname).replace(/\\/g, '/');
    const baseName = path.basename(requestedName);
    const extension = path.extname(file.originalname);
    const nameWithoutExtension = extension
      ? baseName.toLowerCase().endsWith(extension.toLowerCase())
        ? baseName.slice(0, -extension.length)
        : baseName
      : baseName;
    const safeStem = this.sanitizeSegment(nameWithoutExtension);

    return `${safeStem || 'file'}${extension || ''}`;
  }

  private parseStorageAddress(storageAddress?: string): string[] {
    if (!storageAddress?.trim()) {
      return [];
    }

    const normalized = storageAddress.replace(/\\/g, '/').trim();
    const segments = normalized
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => this.sanitizeSegment(segment));

    if (segments.some((segment) => segment === '..')) {
      throw new BadRequestException('storageAddress 不能包含上级目录');
    }

    return segments;
  }

  private sanitizeSegment(value: string): string {
    return value
      .split('')
      .filter((character) => character.charCodeAt(0) >= 32)
      .join('')
      .replace(/[<>:"|?*]/g, '')
      .replace(/\.+$/g, '')
      .trim();
  }

  private async resolveUniqueFilePath(directory: string, fileName: string): Promise<string> {
    const extension = path.extname(fileName);
    const stem = extension ? fileName.slice(0, -extension.length) : fileName;
    let candidate = path.join(directory, fileName);
    let index = 1;

    while (await this.exists(candidate)) {
      candidate = path.join(directory, `${stem}-${index}${extension}`);
      index += 1;
    }

    return candidate;
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private assertInsideRoot(targetPath: string): void {
    const relative = path.relative(this.rootDirectory, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new BadRequestException('存储地址不能超出本地文件根目录');
    }
  }

  private toUrlPath(relativePath: string): string {
    return relativePath
      .split(path.sep)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}
