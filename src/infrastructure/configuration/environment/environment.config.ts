import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
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
  },
  TELEMETRY: {
    OTLP_ENDPOINT: process.env.TELEMETRY_OTLP_ENDPOINT,
    UPTRACE_DSN: process.env.TELEMETRY_UPTRACE_DSN || "",
    SERVICE_NAME: process.env.TELEMETRY_SERVICE_NAME,
  },
};
