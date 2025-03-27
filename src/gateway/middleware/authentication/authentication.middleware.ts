import { UnauthorizedException } from '@common/exceptions';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
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
          switch (info?.message) {
            case 'Invalid token':
              return next(new UnauthorizedException('Invalid access token'));
            case 'jwt expired':
              return next(new UnauthorizedException('Access token has expired'));
            case 'User not found':
              return next(new UnauthorizedException('User not found'));
            case 'Token is no longer valid':
              return next(new UnauthorizedException('Token is no longer valid'));
            default:
              return next(new UnauthorizedException('Unauthorized access'));
          }
        }

        req.user = user;
        next();
      },
    )(req, res, next);
  };
}
