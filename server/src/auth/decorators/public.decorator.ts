import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 标记无需 token 验证的接口。
 * 全局 TokenAuthGuard 会读取该元数据并跳过校验。
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
