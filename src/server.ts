import os from "os";

import cluster from "cluster";
import app from "./app";
import "tsconfig-paths/register";
import { CONFIG } from "@infrastructure/configuration/environment/environment.config";
import logger from "@infrastructure/logging/logger";
import { messageHelper } from "@common/helpers/messages";
import messages from "@infrastructure/configuration/messages/messages.json";

if (cluster.isPrimary) {
  logger.info(
    messageHelper(messages.cluster.primaryRunning, { pid: process.pid })
  );

  const numCPUs = os.cpus().length;
  logger.info(
    messageHelper(messages.cluster.forkingWorkers, { numCPUs: numCPUs })
  );

  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(
      messageHelper(messages.cluster.workerDied, {
        pid: worker.process.pid,
        code: code,
        signal: signal,
      })
    );
    const newWorker = cluster.fork();
    logger.info(
      messageHelper(messages.cluster.newWorkerForked, {
        pid: newWorker.process.pid,
      })
    );
  });
} else {
  app.listen(CONFIG.SYSTEM.PORT, () => {
    messageHelper(messages.cluster.workerStarted, {
      pid: process.pid,
      port: CONFIG.SYSTEM.PORT,
    });
  });
}
