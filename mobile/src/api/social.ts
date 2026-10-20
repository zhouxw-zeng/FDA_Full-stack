import { http } from './request';
import { normalizeDynamic } from './forum';

import type {
  ForumDynamic,
  PageResult,
  SocialConversation,
  SocialFollowState,
  SocialMessage,
  SocialStats,
  SocialUser,
  SocialUserDetail,
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

export function fetchSocialUser(userId: string): Promise<SocialUserDetail> {
  return http.get<SocialUserDetail>(`/social/users/${userId}`);
}

export async function fetchUserDynamics(
  userId: string,
  page = 1,
  size = 10,
): Promise<PageResult<ForumDynamic>> {
  const result = await http.get<PageResult<ForumDynamic>>(`/social/users/${userId}/dynamics`, {
    page,
    size,
  });

  return { ...result, list: result.list.map(normalizeDynamic) };
}

export function fetchSocialStats(): Promise<SocialStats> {
  return http.get<SocialStats>('/social/stats');
}

export function openSocialConversation(targetUserId: string): Promise<SocialConversation> {
  return http.post<SocialConversation>('/social/conversations', { targetUserId });
}

export function fetchSocialConversations(
  page = 1,
  size = 15,
): Promise<PageResult<SocialConversation>> {
  return http.get<PageResult<SocialConversation>>('/social/conversations', { page, size });
}

export function pinSocialConversation(
  conversationId: string,
  pinned: boolean,
): Promise<{ success: boolean; id: string; isPinned: boolean }> {
  return http.put<{ success: boolean; id: string; isPinned: boolean }>(
    `/social/conversations/${conversationId}/pin`,
    { pinned },
  );
}

export function deleteSocialConversation(
  conversationId: string,
): Promise<{ success: boolean; id: string }> {
  return http.delete<{ success: boolean; id: string }>(`/social/conversations/${conversationId}`);
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
