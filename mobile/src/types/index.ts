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
  shareCount: number;
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

export type ChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
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
