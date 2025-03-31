import express from 'express';
import { Api, BaseRoute, messages, ServiceBase } from '@common/index';
import { UserAccountRoute } from '@modules/index';
import { CONFIG } from '../environment/environment.config';
import { logger } from '@infrastructure/config';
// import { KeyRotationRoute } from '@modules/keyRotation/keyRotation.route';
import { AuthenticationRoute } from '@modules/authentication/authentication.route';
import { SeedRoute } from '@modules/seed/seed.route';
// import { LogRoute } from '@modules/log/log.route';

class RoutesConfiguration extends ServiceBase {
  private _app: express.Application | null = null;
  private readonly _routes: express.Router[] = [];
  private readonly _apiBasePath: string;

  constructor() {
    super(RoutesConfiguration.name);
    this._apiBasePath = `/${Api.apiRoot}/${CONFIG.API.API_VERSION}`;
  }

  public registerRoute<T extends BaseRoute>(RouteClass: new (router: express.Router) => T): this {
    const router = express.Router();
    new RouteClass(router);
    this._routes.push(router);
    return this;
  }

  public async configure(app: express.Application): Promise<void> {
    this._app = app;

    this.registerRoute(UserAccountRoute)
      .registerRoute(AuthenticationRoute)
      .registerRoute(SeedRoute);
    // .registerRoute(LogRoute)
    // .registerRoute(KeyRotationRoute);

    this._routes.forEach(route => {
      this._app!.use(this._apiBasePath, route);
    });

    logger.info(messages.service.configured(RoutesConfiguration.name));
  }

  public isConfigured(): boolean {
    return this._app !== null;
  }
}

export const routesConfiguration = RoutesConfiguration.getInstance();
