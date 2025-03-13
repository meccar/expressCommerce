import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@infrastructure/index';
import { statusCodes } from '@common/index';

declare global {
  namespace Express {
    interface Response {
      success<T>(data?: T | string | null, code?: number): void;
      error(data?: string, code?: number): void;
    }
  }
}

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.success = function (data?: string, code: number = statusCodes.OK): void {
    const response: ApiResponse = {
      ok: true,
      data: data,
    };
    res.status(code).json(response);
  };

  res.error = function (data?: string, code: number = statusCodes.BAD_REQUEST): void {
    const response: ApiResponse = {
      ok: false,
      data: data,
    };
    res.status(code).json(response);
  };

  next();
};
