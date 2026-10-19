import { http } from './request';

import type {
  PageResult,
  SocialFollowState,
  SocialMessage,
  SocialStats,
  SocialUser,
} from '@/types';

export function searchSocialUsers(
  keyword = '',
  page = 1,
  size = 15,
): Promise<PageResult<SocialUser>> {
  return http.get<PageResult<SocialUser>>('/social/users', {
    page,
    size,
    keyword,
  });
}

export function fetchSocialFriends(page = 1, size = 15): Promise<PageResult<SocialUser>> {
  return http.get<PageResult<SocialUser>>('/social/friends', {
    page,
    size,
  });
}

export function fetchSocialUser(userId: string): Promise<SocialUser> {
  return http.get<SocialUser>(`/social/users/${userId}`);
}

export function fetchSocialStats(): Promise<SocialStats> {
  return http.get<SocialStats>('/social/stats');
}

export function followSocialUser(targetUserId: string): Promise<SocialFollowState> {
  return http.put<SocialFollowState>('/social/follows', {
    targetUserId,
  });
}

export function unfollowSocialUser(targetUserId: string): Promise<SocialFollowState> {
  return http.delete<SocialFollowState>(`/social/follows/${targetUserId}`);
}

export function sendSocialMessage(payload: {
  recipientId: string;
  content: string;
  requestId?: string;
}): Promise<SocialMessage> {
  return http.post<SocialMessage>('/social/messages', payload);
}

export function fetchSocialMessages(
  userId: string,
  page = 1,
  size = 20,
): Promise<PageResult<SocialMessage>> {
  return http.get<PageResult<SocialMessage>>(`/social/messages/${userId}`, {
    page,
    size,
  });
}
