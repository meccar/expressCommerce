import { Options, SyncOptions } from '@sequelize/core';
import { MySqlDialect } from '@sequelize/mysql';
import {
  Role,
  RoleClaim,
  UserAccount,
  UserClaim,
  UserLogin,
  UserProfile,
  UserRole,
  UserToken,
} from '@modules/index';
import { Environments } from '@common/index';
import { CONFIG } from '@config/index';
import { logger } from '@infrastructure/index';

const models = [
  UserClaim,
  UserLogin,
  UserToken,
  Role,
  RoleClaim,
  UserRole,
  UserAccount,
  UserProfile,
];

type LoggingFunction = (sql: string, timing?: number) => void;

export const dbConfig: Options<MySqlDialect> = {
  host: CONFIG.DB.HOST,
  port: parseInt(CONFIG.DB.PORT),
  database: CONFIG.DB.DATABASE,
  user: CONFIG.DB.USER,
  password: CONFIG.DB.PASSWORD,
  dialect: MySqlDialect,
  pool: {
    max: 1000,
    min: 0,
    acquire: 30 * 1000,
    idle: 10 * 1000,
  },
  retry: {
    max: 10,
    timeout: 3 * 1000,
  },
  charset: 'utf8mb4',
  timezone: '+07:00',
  logging:
    process.env.NODE_ENV !== 'production'
      ? (((sql: string, timing?: number) => {
          logger.info(`${sql} ${timing ? `[${timing}ms]` : ''}`);
        }) as LoggingFunction)
      : false,
  models: models,
  define: {
    timestamps: true,
    underscored: true,
  },
};

export const syncOptions: SyncOptions = {
  alter: process.env.NODE_ENV !== Environments.Production,
  force: false,
};
