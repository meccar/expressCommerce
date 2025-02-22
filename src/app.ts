import { routes } from "src/configuration/routes";
import { errorHandler } from "@common/middleware/errorHandler";
import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    // this.app.use(requestLogger);
  }

  private initializeRoutes() {
    routes(this.app);
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }
}

export default new App().app;
