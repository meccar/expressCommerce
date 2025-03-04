import express from "express";
import { Api, messages, ServiceBase } from "@common/index";
import { UserAccountRoute } from "@modules/index";
import { CONFIG } from "../environment/environment.config";
import { logger } from "@infrastructure/config";
import { KeyRotationRoute } from "@modules/keyRotation/keyRotation.route";

class RoutesConfiguration extends ServiceBase {
  private _app: express.Application | null = null;

  constructor() {
    super(RoutesConfiguration.name);
  }

  public async configure(app: express.Application): Promise<void> {
    this._app = app;

    const apiBasePath = `/${Api.apiRoot}/${CONFIG.API.API_VERSION}`;
    const userAccountRoute = express.Router();
    const adminRoute = express.Router();

    new UserAccountRoute(userAccountRoute);
    new KeyRotationRoute(adminRoute);

    this._app.use(apiBasePath, userAccountRoute);
    this._app.use(apiBasePath, adminRoute);

    logger.info(messages.service.configured(RoutesConfiguration.name));
  }

  public isConfigured(): boolean {
    return this._app !== null;
  }
}

export const routesConfiguration = RoutesConfiguration.getInstance();
