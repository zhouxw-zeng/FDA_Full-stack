import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { TokenService } from '../services/token.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * 全局接口入口先检查 token。
   * @Public() 接口会跳过，其他接口必须在请求头携带 Bearer accessToken。
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, accessToken] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('请先登录并携带 Bearer Token');
    }

    request.authUser = await this.tokenService.validateAccessToken(accessToken);
    return true;
  }
}
