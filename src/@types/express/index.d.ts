import { IAuthenticatedUser } from '@infrastructure/index';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthenticatedUser;
      startTime?: number;
    }
  }
}

export {};
