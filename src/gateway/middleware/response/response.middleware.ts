import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@infrastructure/index';
import { statusCodes } from '@common/index';

declare global {
  namespace Express {
    interface Response {
      success<T>(data?: T | string | null, code?: number, message?: string): void;
      error(message?: string, code?: number): void;
    }
  }
}

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.success = function (data?: string, code: number = statusCodes.OK, message?: string): void {
    const response: ApiResponse = {
      ok: true,
      data: data,
      message: message,
    };
    res.status(code).json(response);
  };

  res.error = function (data?: string, code: number = statusCodes.BAD_REQUEST): void {
    const response: ApiResponse = {
      ok: false,
      message: data,
    };
    res.status(code).json(response);
  };

  next();
};
