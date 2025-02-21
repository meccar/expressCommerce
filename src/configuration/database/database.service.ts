import { Sequelize, Options } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { dbConfig } from "./database.configuration";

class DatabaseService {
  private static instance: DatabaseService;
  private _sequelize: Sequelize = {} as any;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public get sequelize(): Sequelize {
    if (!this._sequelize) {
      throw new Error("Database not initialized");
    }
    return this._sequelize;
  }

  public async initialize(): Promise<void> {
    try {
      this._sequelize = new Sequelize(dbConfig);

      await this._sequelize.authenticate();
      console.log("Database connection established successfully");

      const syncOptions = {
        alter: process.env.NODE_ENV !== "production",
        force: false,
      };

      await this._sequelize.sync(syncOptions);
      console.log("Database models synchronized");
    } catch (error) {
      console.error("Failed to initialize database:", error);
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
