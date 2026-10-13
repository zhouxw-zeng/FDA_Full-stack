/** 后台角色：路由级权限以此为准 */
export type AdminRole = 'super_admin' | 'forum_admin' | 'ad_admin';

export interface LoginParams {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
  profile: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
  roles: AdminRole[];
  lastLoginAt: string;
}

export interface UpdateProfilePayload {
  nickname: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

