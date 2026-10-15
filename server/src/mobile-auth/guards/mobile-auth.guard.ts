import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { MobileAuthenticatedRequest } from '../interfaces/mobile-authenticated-request.interface';
import { MobileTokenService } from '../mobile-token.service';

@Injectable()
export class MobileAuthGuard implements CanActivate {
  constructor(private readonly mobileTokenService: MobileTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MobileAuthenticatedRequest>();
    const [type, accessToken] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !accessToken) {
      throw new UnauthorizedException('请先登录并携带移动端 Bearer Token');
    }

    request.mobileCustomerId = await this.mobileTokenService.validateAccessToken(accessToken);
    return true;
  }
}
