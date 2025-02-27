import express from "express";
import { CONFIG } from "@infrastructure/index";
import { Api } from "@common/index";
import { UserAccountRoute } from "@modules/index";

export class RoutesConfiguration {
  constructor(private readonly app: express.Application) {
    this.app = app;
    this.configureRoutes();
  }

  private configureRoutes(): void {
    const apiBasePath = `/${Api.apiRoot}/${CONFIG.API.API_VERSION}`;
    const userAccountRoute = express.Router();

    new UserAccountRoute(userAccountRoute);

    this.app.use(apiBasePath, userAccountRoute);
  }
}
