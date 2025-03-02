import express from "express";
import { Api, messages, ServiceBase } from "@common/index";
import { UserAccountRoute } from "@modules/index";
import { CONFIG } from "../environment/environment.config";
import { logger } from "@infrastructure/config";

class RoutesConfiguration extends ServiceBase {
  private _app: express.Application | null = null;

  constructor() {
    super(RoutesConfiguration.name);
  }

  public async configure(app: express.Application): Promise<void> {
    this._app = app;

    const apiBasePath = `/${Api.apiRoot}/${CONFIG.API.API_VERSION}`;
    const userAccountRoute = express.Router();

    new UserAccountRoute(userAccountRoute);

    this._app.use(apiBasePath, userAccountRoute);
    logger.info(messages.service.configured(RoutesConfiguration.name));
  }

  public isConfigured(): boolean {
    return this._app !== null;
  }
}

export const routesConfiguration = RoutesConfiguration.getInstance();
