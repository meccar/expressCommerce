import { nextCatch } from '@common/index';
import { authenticationMiddleware } from '@gateway/index';
import { RequestValidator } from '@gateway/middleware/validation/validator/validator';
import express from 'express';
import { Request, Response } from 'express';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
type RouteHandler = (req: Request, res: Response) => Promise<void>;

export abstract class BaseRoute {
  constructor(
    protected readonly router: express.Router,
    protected readonly basePath: string,
  ) {}

  private errorHandler(handler: Function) {
    return nextCatch(handler.bind(this));
  }

  protected protectedRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    validator?: RequestValidator,
  ): void {
    validator
      ? this.router[method](
          `${this.basePath}${path}`,
          authenticationMiddleware(),
          validator.middleware(),
          this.errorHandler(handler),
        )
      : this.router[method](
          `${this.basePath}${path}`,
          authenticationMiddleware(),
          this.errorHandler(handler),
        );
  }

  protected publicRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    validator?: RequestValidator,
  ): void {
    validator
      ? this.router[method](
          `${this.basePath}${path}`,
          validator.middleware(),
          this.errorHandler(handler),
        )
      : this.router[method](`${this.basePath}${path}`, this.errorHandler(handler));
  }
}
