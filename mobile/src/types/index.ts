export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageQuery {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  pageSize?: number;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export interface UserProfile {
  id: string;
  username: string | null;
  nickname: string;
  email: string | null;
  phone: string;
  avatar: string | null;
  gender: number;
  birthday: string | null;
  region: string | null;
  signature: string | null;
  vipLevel: number;
  auditStatus: 'pending' | 'approved' | 'rejected';
  enabled: number;
  createdAt?: string;
}

export interface UserInfo extends UserProfile {
  auditRemark: string | null;
  auditedAt: string | null;
  dynamicCount: number;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  nickname: string;
  email?: string;
  avatar?: string;
  gender?: number;
  birthday?: string;
  region?: string;
  signature?: string;
}

export interface AvatarOption {
  name: string;
  url: string;
}

export interface UploadedFileInfo {
  originalName: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  mimeType: string;
  size: number;
  storageAddress: string;
  relativePath: string;
  url: string;
}

export interface LoginResult extends AuthTokens {
  profile: UserProfile;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForumMediaItem {
  id: string;
  kind: 'album' | 'video';
  title: string;
  url?: string;
  seed: number;
  duration?: number;
  size: number;
}

export interface ForumDynamicAuthor {
  id: string;
  nickname: string;
  avatar?: string | null;
  vipLevel?: number;
}

export interface ForumDynamic {
  id: string;
  title?: string;
  content: string;
  media: ForumMediaItem[];
  author: ForumDynamicAuthor;
  typeId: number;
  typeName: string;
  topic: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  liked: boolean;
  favorited: boolean;
  createdAt: string;
  pinned: boolean;
  auditStatus: 'pending' | 'approved' | 'rejected';
  enabled: number;
}

export interface ForumDynamicQuery extends PageQuery {
  topic?: string;
  typeId?: number;
  pinned?: boolean;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  enabled?: number;
}

export type MyForumDynamicStatus = 'published' | 'pending' | 'rejected';

export interface MyForumDynamicQuery extends PageQuery {
  keyword?: string;
  topic?: string;
  typeId?: number;
  pinned?: boolean;
  status?: MyForumDynamicStatus;
}

export interface UpdateMyForumDynamicPayload {
  title?: string;
  content?: string;
  typeId?: number;
  media?: ForumMediaItem[];
  remark?: string;
}

export interface CreateMyForumDynamicPayload {
  title?: string;
  content: string;
  typeId?: number;
  topic?: string;
  media?: ForumMediaItem[];
}

export interface ForumComment {
  id: string;
  dynamicId: string;
  rootId: string | null;
  parentId: string | null;
  content: string | null;
  deleted: boolean;
  author: ForumDynamicAuthor | null;
  replyToCustomerId: string | null;
  replyCount: number;
  likeCount: number;
  createdAt: string;
  isOwn: boolean;
}

export interface ForumInteractionInfo {
  dynamicId: string;
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
}

export type ForumNotificationType =
  | 'dynamic_like'
  | 'dynamic_comment'
  | 'comment_reply'
  | 'user_follow';

export interface ForumNotification {
  id: string;
  type: ForumNotificationType;
  dynamicId: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    nickname: string;
    avatar: string | null;
  } | null;
  dynamic: {
    id: string;
    title: string | null;
    content: string;
    topic: string;
  } | null;
  message: string;
}

export interface SocialUser {
  id: string;
  nickname: string;
  avatar: string | null;
  signature: string | null;
  region: string | null;
  vipLevel: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  canChat: boolean;
  canLeaveMessage: boolean;
}

export interface SocialFollowState {
  success: boolean;
  targetUserId: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  canChat: boolean;
}

export interface SocialStats {
  following: number;
  followers: number;
  dynamics: number;
}

export interface SocialMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveryMode: 'guestbook' | 'chat';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    nickname: string;
    avatar: string | null;
  } | null;
  isMutual?: boolean;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AiChatSession {
  id: string;
  modelConfigId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatRequest {
  message: string;
  sessionId?: string;
  modelConfigId?: string;
}

export interface AiChatResponse {
  sessionId: string;
  message: AiChatMessage;
  usage?: Record<string, unknown>;
  providerCode?: string;
  modelName?: string;
}
