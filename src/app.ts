import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import {
  databaseService,
  logger,
  RoutesConfiguration,
  SwaggerConfiguration,
} from "@infrastructure/index";
import { errorMiddleware, responseMiddleware } from "@gateway/index";
import swaggerUi from "swagger-ui-express";

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeInfrastructure();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeInfrastructure() {
    await databaseService.initialize(process.pid);
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());

    const httpLogger = pinoHttp({ logger });
    this.app.use(httpLogger);

    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ limit: "100mb", extended: true }));

    // this.app.use(cookieParser)
    this.app.use(responseMiddleware);
  }

  private initializeRoutes() {
    new RoutesConfiguration(this.app);
    new SwaggerConfiguration(this.app);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
