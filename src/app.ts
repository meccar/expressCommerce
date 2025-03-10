import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import {
  databaseService,
  logger,
  mailService,
  swaggerConfiguration,
} from "@infrastructure/index";
import { errorMiddleware, responseMiddleware } from "@gateway/index";
import { CONFIG, routesConfiguration } from "@config/index";
import { vaultService } from "@infrastructure/vault/vault.service";
import { keyRotationService } from "@infrastructure/keyRotation/keyRotation.service";

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeInfrastructure().then(() => {
      this.initializeApplication();
      this.initializeErrorHandling();
    });
  }

  private async initializeInfrastructure() {
    await databaseService.configure(process.pid);
    await mailService.configure(
      CONFIG.SMTP.SMTP_HOST,
      Number(CONFIG.SMTP.SMTP_PORT),
      CONFIG.SMTP.SMTP_USER,
      CONFIG.SMTP.SMTP_PASS,
      CONFIG.SMTP.SMTP_MAIL_SENDER
    );

    await vaultService.configure(
      CONFIG.VAULT.VAULT_ADDR || "http://127.0.0.1:8200",
      CONFIG.VAULT.VAULT_TOKEN
    );

    await keyRotationService.configure("/secret/data/my-key", {
      useTransitEngine: CONFIG.VAULT.USE_TRANSIT_ENGINE,
      transitPath: CONFIG.VAULT.TRANSIT_PATH,
      keyName: CONFIG.VAULT.KEY_NAME,
    });

    await swaggerConfiguration.configure(this.app);
  }

  private async initializeApplication() {
    await routesConfiguration.configure(this.app);
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

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
