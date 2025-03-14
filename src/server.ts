import 'tsconfig-paths/register';
import 'module-alias/register';

import os from 'os';
import cluster from 'cluster';
import app from './app';
import { logger } from '@infrastructure/index';
import { messages } from '@common/index';
import { CONFIG } from '@config/index';

// if (cluster.isPrimary) {
//   logger.info(messages.cluster.primaryRunning(process.pid));

//   const numCPUs = os.cpus().length;
//   logger.info(messages.cluster.forkingWorkers(numCPUs));

//   for (let i = 0; i < numCPUs; i++) cluster.fork();

//   cluster.on("exit", (worker, code, signal) => {
//     logger.warn(messages.cluster.workerDied(worker.process.pid, code, signal));
//     const newWorker = cluster.fork();
//     logger.info(messages.cluster.newWorkerForked(newWorker.process.pid));
//   });
// } else {
app.listen(CONFIG.SYSTEM.PORT, () => {
  logger.info(messages.cluster.workerStarted(process.pid, CONFIG.SYSTEM.PORT));
});
// }
