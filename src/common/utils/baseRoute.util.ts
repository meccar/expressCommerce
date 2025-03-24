import { HttpMethod, nextCatch } from '@common/index';
import { authenticationMiddleware } from '@gateway/index';
import { authorizationMiddleware } from '@gateway/middleware/authorization/authorization.middlware';
import express from 'express';
import { Request, Response } from 'express';

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
    handler: RouteHandler,
    path?: string,
    // validator?: RequestValidator,
  ): void {
    path
      ? this.router[method](
          `${this.basePath}${path}`,
          authenticationMiddleware(),
          authorizationMiddleware(),
          this.errorHandler(handler),
        )
      : this.router[method](
          `${this.basePath}`,
          authenticationMiddleware(),
          authorizationMiddleware(),
          this.errorHandler(handler),
        );
    // validator
    //   ? this.router[method](
    //       `${this.basePath}${path}`,
    //       authenticationMiddleware(),
    //       validator.middleware(),
    //       this.errorHandler(handler),
    //     )
    //   : this.router[method](
    //       `${this.basePath}${path}`,
    //       authenticationMiddleware(),
    //       this.errorHandler(handler),
    //     );
  }

  protected publicRoute(
    method: HttpMethod,
    handler: RouteHandler,
    path?: string,
    // validator?: RequestValidator,
  ): void {
    path
      ? this.router[method](`${this.basePath}${path}`, this.errorHandler(handler))
      : this.router[method](`${this.basePath}`, this.errorHandler(handler));
    // validator
    //   ? this.router[method](
    //       `${this.basePath}${path}`,
    //       validator.middleware(),
    //       this.errorHandler(handler),
    //     )
    //   : this.router[method](`${this.basePath}${path}`, this.errorHandler(handler));
  }
}
