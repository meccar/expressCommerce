import { UnauthorizedException } from '@common/index';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { Request, Response, NextFunction } from 'express';

export function authorizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedException();
    req.permission = new AuthorizationService(req.user);
    next();
  };
}
