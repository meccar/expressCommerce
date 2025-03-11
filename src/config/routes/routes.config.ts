import express from "express";
import { Api, BaseRoute, messages, ServiceBase } from "@common/index";
import { UserAccountRoute } from "@modules/index";
import { CONFIG } from "../environment/environment.config";
import { logger } from "@infrastructure/config";
import { KeyRotationRoute } from "@modules/keyRotation/keyRotation.route";
import { AuthenticationRoute } from "@modules/authentication/authentication.route";

interface RouteRegistration {
  path: string;
  router: express.Router;
}

class RoutesConfiguration extends ServiceBase {
  private _app: express.Application | null = null;
  private readonly _routes: Map<string, express.Router> = new Map();
  private readonly _apiBasePath: string;

  constructor() {
    super(RoutesConfiguration.name);
    this._apiBasePath = `/${Api.apiRoot}/${CONFIG.API.API_VERSION}`;
  }

  public registerRoute<T extends BaseRoute>(RouteClass: new (router: express.Router) => T): this {
    const router = express.Router();
    new RouteClass(router);
    this._routes.set(this._apiBasePath, router);
    return this;
  }

  public async configure(app: express.Application): Promise<void> {
    this._app = app;

    this.registerRoute(UserAccountRoute)
        .registerRoute(AuthenticationRoute)
        .registerRoute(KeyRotationRoute);
    
    this._routes.forEach((router, path) => {
      this._app!.use(path, router);
    });

    logger.info(messages.service.configured(RoutesConfiguration.name));
  }

  public isConfigured(): boolean {
    return this._app !== null;
  }
}

export const routesConfiguration = RoutesConfiguration.getInstance();
