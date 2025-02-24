import { Sequelize, Options } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { dbConfig } from "../configuration/database/database.configuration";
import logger from "@infrastructure/logging/logger";
import { messages } from "@common/constants/messages";

class DatabaseService {
  private static instance: DatabaseService;
  private _sequelize: Sequelize<MySqlDialect> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public get sequelize(): Sequelize<MySqlDialect> {
    if (!this._sequelize) {
      throw new Error(messages.db.notInitialized());
    }
    return this._sequelize;
  }

  public async initialize(workerPid: number): Promise<void> {
    try {
      this._sequelize = new Sequelize(dbConfig);

      await this._sequelize.authenticate();
      logger.info(messages.db.established(workerPid));

      const syncOptions = {
        alter: process.env.NODE_ENV !== "production",
        force: false,
      };

      await this._sequelize.sync(syncOptions);
      logger.info(
        messages.db.modelsSynchronized(workerPid, this._sequelize.models.size)
      );
    } catch (error) {
      logger.error(`${messages.db.initializationFailed(workerPid)}:`, error);
      throw error;
    }
  }

  public async closeConnection(): Promise<void> {
    if (this._sequelize) {
      await this._sequelize.close();
      this._sequelize = null;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
