import Sequelize from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { dbConfig } from "./database.configuration";

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
      throw new Error("Database not initialized");
    }
    return this._sequelize;
  }

  public async initialize(): Promise<void> {
    try {
      this._sequelize = new Sequelize({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? "3306"),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: MySqlDialect,
        pool: {
          max: 1000,
          min: 0,
          accquire: 30 * 1000,
          idle: 10 * 1000,
        },
        retry: {
          max: 10,
          timeout: 3 * 1000,
        },
        charset: "utf8mb4",
        timezone: "+07:00",
        logging:
          process.env.NODE_ENV !== "production"
            ? (sql: string, timing?: number) => {
                console.log(`${sql} ${timing ? `[${timing}ms]` : ""}`);
              }
            : false,
        models: Object.values(models).flat(),
        define: {
          timestamps: true,
          underscored: true,
        },
      });

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
