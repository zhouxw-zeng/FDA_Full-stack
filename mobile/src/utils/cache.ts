const CACHE_PREFIX = 'mobile_cache:';

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

export function setCache<T>(key: string, value: T): void {
  uni.setStorageSync(cacheKey(key), JSON.stringify(value));
}

export function getCache<T>(key: string): T | null {
  const raw = uni.getStorageSync(cacheKey(key));
  if (typeof raw !== 'string' || !raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    removeCache(key);
    return null;
  }
}

export function removeCache(key: string): void {
  uni.removeStorageSync(cacheKey(key));
}

export function clearCache(): void {
  const storageInfo = uni.getStorageInfoSync();
  storageInfo.keys
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .forEach((key) => uni.removeStorageSync(key));
}
