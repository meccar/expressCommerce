import { IAuthenticatedUser } from '@infrastructure/index';
import { AuthorizationService } from '@modules/authorization/authorization.service';

declare global {
  namespace Express {
    interface User extends IAuthenticatedUser {}

    interface Request {
      user?: IAuthenticatedUser;
      startTime?: number;
      permission: AuthorizationService;
      clientIp: string;
    }
  }
}
