import { UnauthorizedException } from '@common/index';
import { Request, Response, NextFunction } from 'express';
export function authorizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedException();
    next();
  };
}
