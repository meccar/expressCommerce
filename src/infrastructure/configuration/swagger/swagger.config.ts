import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "../swagger/swaggerOptions";

export class SwaggerConfiguration {
  constructor(private readonly app: express.Application) {
    this.app = app;
    this.configure();
  }

  private configure(): void {
    const swaggerOptions = {
      explorer: true,
      validatorUrl: null,
    };

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocs, swaggerOptions)
    );
  }
}
