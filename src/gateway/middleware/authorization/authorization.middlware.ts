import { UnauthorizedException } from '@common/index';
import { IAuthenticatedUser } from '@infrastructure/index';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { Request, Response, NextFunction } from 'express';

export function authorizationMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedException();
    const authService = new AuthorizationService(req.user as IAuthenticatedUser);

    await authService.configure();

    (req as any).permission = authService;
    
    next();
  };
}
