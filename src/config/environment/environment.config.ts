import { Environments } from '@common/index';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const CONFIG = {
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || '3060',
    USER: process.env.DB_USER || 'expressCommerce',
    PASSWORD: process.env.DB_PASSWORD || 'password',
    DATABASE: process.env.DB_DATABASE || 'expressCommerce',
  },
  SYSTEM: {
    APP_NAME: process.env.APP_NAME,
    FRONTEND_URL: process.env.FRONTEND_URL,
    PORT: process.env.PORT || '8000',
    ENV: process.env.NODE_ENV,
    ENCRYPT_SENSITIVE_SECRET_KEY: process.env.ENCRYPT_SENSITIVE_SECRET_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    EMAIL_TOKEN_EXPIRYL: Number(process.env.EMAIL_TOKEN_EXPIRYL),
    REFRESH_PASSWORD_TOKEN_EXPIRY: Number(process.env.REFRESH_PASSWORD_TOKEN_EXPIRY),
  },
  TELEMETRY: {
    OTLP_ENDPOINT: process.env.TELEMETRY_OTLP_ENDPOINT,
    UPTRACE_DSN: process.env.TELEMETRY_UPTRACE_DSN || '',
    SERVICE_NAME: process.env.TELEMETRY_SERVICE_NAME,
  },
  API: {
    API_VERSION: process.env.API_VERSION,
  },
  SMTP: {
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    SMTP_MAIL_SENDER: process.env.SMTP_MAIL_SENDER!,
  },
  VAULT: {
    VAULT_ADDR: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    VAULT_TOKEN: process.env.VAULT_TOKEN || '',
    USE_TRANSIT_ENGINE: process.env.USE_VAULT_TRANSIT === 'true',
    TRANSIT_PATH: process.env.VAULT_TRANSIT_PATH || 'transit',
    KEY_NAME: process.env.VAULT_KEY_NAME || 'database-encryption',
  },
};
