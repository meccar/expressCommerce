import { NotFoundException, UnauthorizedException } from '@common/exceptions';
import passport from 'passport';
import express, { Request, Response, NextFunction } from 'express';
import { IAuthenticatedUser } from '@infrastructure/index';

export function authenticationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).startTime = Date.now();
    passport.authenticate(
      'jwt',
      { session: false },
      (err: any, user: IAuthenticatedUser | false, info: { message: string } | undefined) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          if (info && info.message === 'Invalid token') {
            return next(new UnauthorizedException('Invalid token'));
          }
          if (info && info.message === 'User not found') {
            return next(new UnauthorizedException('User not found'));
          }
          return next(new UnauthorizedException('Unauthorized access'));
        }
        
        req.user = user;
        next();
      },
    )(req, res, next);
  };
}
