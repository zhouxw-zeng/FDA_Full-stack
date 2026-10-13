const ACCESS_TOKEN_KEY = 'album-forum:access-token';
const REFRESH_TOKEN_KEY = 'album-forum:refresh-token';
const PROFILE_KEY = 'album-forum:profile';
const PREFERENCES_KEY = 'album-forum:preferences';

export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storageKeys = {
  profile: PROFILE_KEY,
  preferences: PREFERENCES_KEY,
} as const;

