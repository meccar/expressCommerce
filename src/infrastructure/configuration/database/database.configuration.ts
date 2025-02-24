import { Role } from "@authorization/role.model";
import { RoleClaim } from "@authorization/roleClaim.model";
import { UserRole } from "@authorization/userRole.model";
import { Options, SyncOptions } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { UserAccount } from "@userAccount/userAccount.model";
import { UserProfile } from "@userProfile/userProfile.model";
import { UserClaim } from "@authentication/userClaim.model";
import { UserLogin } from "@authentication/userLogin.model";
import { UserToken } from "@authentication/userToken.model";
import { CONFIG } from "../environment/environment.config";
import logger from "@infrastructure/logging/logger";

export type Models = {
  UserClaim: typeof UserClaim;
  UserLogin: typeof UserLogin;
  UserToken: typeof UserToken;
  Role: typeof Role;
  RoleClaim: typeof RoleClaim;
  UserRole: typeof UserRole;
  UserAccount: typeof UserAccount;
  UserProfile: typeof UserProfile;
};

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

logger.info(models);
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
  charset: "utf8mb4",
  timezone: "+07:00",
  // logging:
  //   process.env.NODE_ENV !== "production"
  //     ? (((sql: string, timing?: number) => {
  //         logger.info(`${sql} ${timing ? `[${timing}ms]` : ""}`);
  //       }) as LoggingFunction)
  //     : false,
  models: models,
  define: {
    timestamps: true,
    underscored: true,
  },
};

export const syncOptions: SyncOptions = {
  alter: process.env.NODE_ENV !== "production",
  force: false,
};
