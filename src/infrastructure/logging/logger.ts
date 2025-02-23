import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: process.env.NODE_ENV === "production" ? "pino/file" : "pino-pretty",
    options: {
      colorize: process.env.NODE_ENV !== "production",
      translateTime: "SYS:standard",
      ignore: "hostname",
    },
  },
});

export default logger;
