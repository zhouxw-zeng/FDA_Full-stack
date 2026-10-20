import type { SocialUser } from '@/types';

export type SocialRelationState = 'none' | 'following' | 'mutual';

export const SOCIAL_RELATION_LABELS: Record<SocialRelationState, string> = {
  none: '未关注',
  following: '已关注',
  mutual: '互关',
};

/** 关注按钮文案：未关注状态展示为「关注」 */
export const SOCIAL_RELATION_BUTTON_LABELS: Record<SocialRelationState, string> = {
  none: '关注',
  following: '已关注',
  mutual: '互关',
};

type RelationInput = Pick<SocialUser, 'isFollowing' | 'isMutual'>;

/** 关注关系三态：未关注 / 已关注 / 互关 */
export function getSocialRelationState(user: RelationInput): SocialRelationState {
  if (user.isMutual) {
    return 'mutual';
  }
  if (user.isFollowing) {
    return 'following';
  }
  return 'none';
}

/** 对方单方面关注了我 */
export function isFollowedByOnly(user: SocialUser): boolean {
  return user.isFollowedBy && !user.isMutual;
}
