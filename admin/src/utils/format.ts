import dayjs from 'dayjs';

export function formatDateTime(value?: string | number | Date): string {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function formatDate(value?: string | number | Date): string {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD');
}

export function formatRelative(value?: string | number | Date): string {
  if (!value) {
    return '-';
  }
  const diffMinutes = dayjs().diff(dayjs(value), 'minute');
  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }
  const diffHours = dayjs().diff(dayjs(value), 'hour');
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }
  const diffDays = dayjs().diff(dayjs(value), 'day');
  if (diffDays < 30) {
    return `${diffDays} 天前`;
  }
  return formatDate(value);
}

/** 大数字缩写：1.2 万 / 3.4 亿 */
export function formatCompactNumber(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)} 亿`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toFixed(1)} 万`;
  }
  return String(value);
}

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) {
    return '';
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

