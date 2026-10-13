import { Request } from 'express';
import { AdminUser } from '../../users/entities/admin-user.entity';

export interface AuthenticatedRequest extends Request {
  authUser?: AdminUser;
}
