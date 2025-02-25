import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { databaseService, logger, routes } from "@infrastructure/index";
import { errorMiddleware } from "@gateway/index";
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
    this.app.use(express.urlencoded({ limit: "100mb" }));
    // this.app.use(cookieParser)
    // this.app.use(requestLogger);
  }

  private initializeRoutes() {
    routes(this.app);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
