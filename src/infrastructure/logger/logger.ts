import pino from "pino";
import { Environments, PinoTransport } from "@common/index";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: process.env.NODE_ENV === Environments.Production ? PinoTransport.File : PinoTransport.Pretty,
    options: {
      colorize: process.env.NODE_ENV !== Environments.Production,
      translateTime: "SYS:standard",
      ignore: "hostname",
    },
  },
});
