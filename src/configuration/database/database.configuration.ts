import { Role } from "@authorization/role.model";
import { RoleClaim } from "@authorization/roleClaim.model";
import { UserRole } from "@authorization/userRole.model";
import { Options, SyncOptions } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import { UserAccount } from "@userAccount/userAccount.model";
import { UserProfile } from "@userProfile/userProfile.model";
import { UserClaim } from "src/modules/authenthication/userClaim.model";
import { UserLogin } from "src/modules/authenthication/userLogin.model";
import { UserToken } from "src/modules/authenthication/userToken.model";

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

const models = {
  authentication: [UserClaim, UserLogin, UserToken],
  authorization: [Role, RoleClaim, UserRole],
  user: [UserAccount, UserProfile],
};

type LoggingFunction = (sql: string, timing?: number) => void;

export const dbConfig: Options<MySqlDialect> = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? "3306"),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
  logging:
    process.env.NODE_ENV !== "production"
      ? (((sql: string, timing?: number) => {
          console.log(`${sql} ${timing ? `[${timing}ms]` : ""}`);
        }) as LoggingFunction)
      : false,
  models: Object.values(models).flat(),
  define: {
    timestamps: true,
    underscored: true,
  },
};

export const syncOptions: SyncOptions = {
  alter: process.env.NODE_ENV !== "production",
  force: false,
};
