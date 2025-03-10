import { UnauthorizedException } from "@common/exceptions";
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedUser } from "@infrastructure/index";

export function authenticationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('jwt', { session: false }, (user: AuthenticatedUser | false) => {
            if (!user) throw new UnauthorizedException();
            
            req.user = user;
            next();
        })(req, res, next);
    };
}