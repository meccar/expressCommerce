import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { dbConfig } from "../config/database/database.config";
import { logger } from "@infrastructure/index";
import {
  BadRequestException,
  Environments,
  messages,
  ServiceBase,
} from "@common/index";

class DatabaseService extends ServiceBase {
  private _sequelize: Sequelize<MySqlDialect> | null = null;

  constructor() {
    super(DatabaseService.name);
  }

  public get sequelize(): Sequelize<MySqlDialect> {
    if (!this._sequelize)
      throw new BadRequestException(messages.db.notInitialized());

    return this._sequelize;
  }

  public async configure(workerPid: number): Promise<void> {
    this._sequelize = new Sequelize(dbConfig);

    await this._sequelize.authenticate();
    logger.info(messages.db.established(workerPid));

    const syncOptions = {
      alter: process.env.NODE_ENV !== Environments.Production,
      force: false,
    };

    await this._sequelize.sync(syncOptions);
    logger.info(
      messages.db.modelsSynchronized(workerPid, this._sequelize.models.size)
    );
    logger.info(messages.service.configured(DatabaseService.name));
  }

  public isConfigured(): boolean {
    return !!this._sequelize;
  }

  public async closeConnection(): Promise<void> {
    if (this._sequelize) {
      await this._sequelize.close();
      this._sequelize = null;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
