import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { databaseService, logger, mailService, swaggerConfiguration } from '@infrastructure/index';
import { errorMiddleware, responseMiddleware, xssClean } from '@gateway/index';
import { CONFIG, routesConfiguration } from '@config/index';
import { vaultService } from '@infrastructure/vault/vault.service';
import { IncomingMessage, ServerResponse } from 'http';
import passport from 'passport';
// import { keyRotationService } from '@infrastructure/keyRotation/keyRotation.service';

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
      CONFIG.SMTP.SMTP_MAIL_SENDER,
    );

    await vaultService.configure(
      CONFIG.VAULT.VAULT_ADDR || 'http://127.0.0.1:8200',
      CONFIG.VAULT.VAULT_TOKEN,
    );

    // await keyRotationService.configure('/secret/data/my-key', {
    //   useTransitEngine: CONFIG.VAULT.USE_TRANSIT_ENGINE,
    //   transitPath: CONFIG.VAULT.TRANSIT_PATH,
    //   keyName: CONFIG.VAULT.KEY_NAME,
    // });

    await swaggerConfiguration.configure(this.app);
  }

  private async initializeApplication() {
    await routesConfiguration.configure(this.app);
  }

  private initializeMiddlewares() {
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' },
      }),
    );

    this.app.use((req, res, next) => {
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'same-origin');
      res.setHeader('X-Frame-Options', 'DENY');
      next();
    });

    this.app.use(
      cors({
        origin: CONFIG.SYSTEM.CORS_ORIGINS || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );

    const httpLogger = pinoHttp({ logger });
    this.app.use(httpLogger);

    this.app.use(
      express.json({
        limit: '100mb',
        verify: (
          req: IncomingMessage,
          res: ServerResponse<IncomingMessage>,
          buf: Buffer,
          encoding: string,
        ): void => {
          JSON.parse(buf.toString());
        },
      }),
    );

    this.app.use(express.urlencoded({ limit: '100mb', extended: true }));

    this.app.use(xssClean);
    
    this.app.use(passport.initialize());

    this.app.use(responseMiddleware);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
