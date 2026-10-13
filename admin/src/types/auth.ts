export interface LoginParams {
  username: string;
  password: string;
}

/** 后端签发的令牌对（POST /auth/login、POST /auth/refresh） */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** accessToken 剩余有效秒数 */
  accessExpiresIn: number;
  /** refreshToken 剩余有效秒数 */
  refreshExpiresIn: number;
}

/** 后台用户信息：登录 / 刷新 / /auth/profile 返回同一套字段 */
export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone?: string | null;
  avatar: string | null;
  department: string | null;
  bio: string | null;
  /** 单一角色 */
  roleId: string;
  roleName: string;
  /** 该角色可访问的 routeId 集合，用于过滤路由树 */
  routeIdGroup: number[];
  status?: number;
  lastLoginAt?: string | null;
}

export interface LoginResult extends AuthTokens {
  user: AuthUser;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

/** 走 PUT /users（后端目前只有这个可更新用户的接口） */
export interface UpdateProfilePayload {
  id: string;
  nickname: string;
  email: string;
  phone?: string;
  department?: string;
  bio?: string;
}

export interface UpdatePasswordPayload {
  id: string;
  newPassword: string;
}

