import logger from "@infrastructure/logging/logger";
import { Request, Response, NextFunction } from "express";
import messages from "@infrastructure/configuration/messages/messages.json";

class HttpException extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

const errorHandler = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || messages.error.internal_server_error;
  logger.error({
    msg: messages.error.error_occur,
    error,
    req: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    },
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
  res.status(status).json({
    status,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
};

export { HttpException, errorHandler };
