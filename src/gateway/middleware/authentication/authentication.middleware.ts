import { UnauthorizedException } from '@common/exceptions';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { IAuthenticatedUser } from '@infrastructure/index';

export function authenticationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    passport.authenticate('jwt', { session: false }, (user: IAuthenticatedUser | false) => {
      if (!user) throw new UnauthorizedException();
      req.user = user;
      next();
    })(req, res, next);
  };
}
