import { Request, Response, NextFunction } from "express";
import { Environments, HttpException, messages, statusCodes } from "@common/index";
import { logger } from "@infrastructure/index";

const errorMiddleware = (
  error: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof HttpException) {
    return res.error(error.message, error.status);
  }

  const status: number = error.status || statusCodes.INTERNAL_SERVER_ERROR;
  const message: string = error.message || messages.error.internal_server_error_500;

  if (process.env.NODE_ENV === Environments.Development) {
    logger.error({
        msg: messages.error.occurred,
        error: {
            name: error.message,
        },
        req: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            headers: req.headers,
            params: req.params,
            query: req.query,
        },
    });
}

  return res.error(message, status);
};

export { errorMiddleware };
