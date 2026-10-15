import { http } from './request';

import type { UserInfo } from '@/types';

export function fetchUserInfo(): Promise<UserInfo> {
  return http.get<UserInfo>('/customers/me');
}
