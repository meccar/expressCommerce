import { IAuthenticatedUser } from '@infrastructure/index';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { Request } from 'express';

declare global {
  namespace Express {
    interface User extends IAuthenticatedUser {}

    interface Request {
      user?: IAuthenticatedUser;
      permission: AuthorizationService;
      clientIp: string;
      startTime: number;
    }
  }
}
