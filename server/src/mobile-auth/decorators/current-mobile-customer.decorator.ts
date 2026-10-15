import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MobileAuthenticatedRequest } from '../interfaces/mobile-authenticated-request.interface';

export const CurrentMobileCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined =>
    context.switchToHttp().getRequest<MobileAuthenticatedRequest>().mobileCustomerId,
);
