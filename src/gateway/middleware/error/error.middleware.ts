import { Request, Response, NextFunction } from "express";
import { Environments, HttpException, messages, ValidationException } from "@common/index";
import { ErrorResponse, logger } from "@infrastructure/index";

const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = 500;
  let message = messages.error.internal_server_error_500;
  let errors: any = undefined;

  if (error instanceof HttpException) {
    status = error.status;
    message = error.message;
    if (error instanceof ValidationException) {
      errors = error.errors;
    }
  } else if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = messages.error.unauthorized_401;
  } else if (error.name === 'TokenExpiredError') {
    status = 401;
    message = messages.error.unauthorized_401;
  } else if (error.name === 'SyntaxError') {
    status = 400;
    message = messages.error.bad_request_400;
  }

  logger.error({
    msg: messages.error.occurred,
    error: {
      name: error.name,
      message: error.message,
      status,
    },
    req: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      headers: req.headers,
      params: req.params,
      query: req.query,
    },
    stack: process.env.NODE_ENV === Environments.Development ? error.stack : undefined,
  });

  const errorResponse: ErrorResponse = {
    status,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  if (process.env.NODE_ENV === Environments.Development) {
    errorResponse.stack = error.stack;
  }

  if (errors) {
    errorResponse.errors = errors;
  }

  res.status(status).json(errorResponse);
};

export { HttpException, errorMiddleware };
