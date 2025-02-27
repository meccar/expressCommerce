import express from 'express';
import { UserAccountRoute } from "@modules/userAccount";
import { CONFIG } from "@infrastructure/index";
import { Api } from '@common/index';

export class RoutesConfiguration {
  constructor(
    private readonly app: express.Application
  ) {
    this.app = app;
    this.configureRoutes();
  }
  
  private configureRoutes(): void {
    const userAccountRouter = express.Router();
    
    new UserAccountRoute(userAccountRouter);
    
    this.app.use(`/${Api.apiRoot}/${CONFIG.API.API_VERSION}`, userAccountRouter);
  }
}