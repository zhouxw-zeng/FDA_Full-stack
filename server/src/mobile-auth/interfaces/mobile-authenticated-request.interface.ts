import type { Request } from 'express';

export interface MobileAuthenticatedRequest extends Request {
  mobileCustomerId?: string;
}
