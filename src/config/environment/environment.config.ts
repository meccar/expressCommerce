import { Environments } from "@common/index";
import dotenv from "dotenv";

if (process.env.NODE_ENV === Environments.Development) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}
export const CONFIG = {
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: process.env.DB_PORT || "3060",
    USER: process.env.DB_USER || "expressCommerce",
    PASSWORD: process.env.DB_PASSWORD || "password",
    DATABASE: process.env.DB_DATABASE || "expressCommerce",
  },
  SYSTEM: {
    PORT: process.env.PORT || "8000",
    ENV: process.env.NODE_ENV,
    ENCRYPT_SENSITIVE_SECRET_KEY: process.env.ENCRYPT_SENSITIVE_SECRET_KEY,
  },
  TELEMETRY: {
    OTLP_ENDPOINT: process.env.TELEMETRY_OTLP_ENDPOINT,
    UPTRACE_DSN: process.env.TELEMETRY_UPTRACE_DSN || "",
    SERVICE_NAME: process.env.TELEMETRY_SERVICE_NAME,
  },
  API: {
    API_VERSION: process.env.API_VERSION,
  },
  SENDGRID: {
    SENDGRID_API: process.env.SENDGRID_API || "123",
    SENDGRID_MAIL_SENDER:
      process.env.SENDGRID_MAIL_SENDER || "default@example.com",
  },
  VAULT: {
    VAULT_ADDR: "",
    VAULT_TOKEN: "",
    USE_TRANSIT_ENGINE: true,
    TRANSIT_PATH: "",
    KEY_NAME: "",
  },
};
