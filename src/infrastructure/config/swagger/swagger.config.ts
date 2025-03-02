import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./swaggerOptions";
import { logger } from "@infrastructure/index";
import { messages, ServiceBase } from "@common/index";

class SwaggerConfiguration extends ServiceBase {
  private _app: express.Application | null = null;

  constructor() {
    super(SwaggerConfiguration.name);
  }

  public async configure(app: express.Application): Promise<void> {
    this._app = app;

    const swaggerOptions = {
      explorer: true,
      validatorUrl: null,
    };

    this._app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocs, swaggerOptions)
    );

    logger.info(messages.service.configured(SwaggerConfiguration.name));
  }

  public isConfigured(): boolean {
    return this._app !== null;
  }
}

export const swaggerConfiguration = SwaggerConfiguration.getInstance();
