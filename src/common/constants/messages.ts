export const messages = {
  // Error messages
  error: {
    occurred: (): string => `An error occurred`,
    internalServerError: (): string => `Something went wrong.`,
    resourceNotFound: (resource: string): string =>
      `The requested resource "${resource}" was not found.`,
    invalidInput: (): string => `Invalid input provided.`,
  },

  // Cluster-related messages
  cluster: {
    primaryRunning: (pid: number): string => `Primary ${pid} is running`,
    forkingWorkers: (numCPUs: number): string =>
      `Forking ${numCPUs} workers...`,
    workerDied: (
      pid: number | undefined,
      code: number,
      signal: string
    ): string => `Worker ${pid} died (exit code: ${code}, signal: ${signal})`,
    newWorkerForked: (pid: number | undefined): string =>
      `Forked a new worker ${pid} to replace the dead worker`,
    workerStarted: (pid: number, port: string): string =>
      `Worker ${pid} started on port ${port}`,
  },

  // Database-related messages
  db: {
    notInitialized: (): string => `Database not initialized`,
    established: (workerPid: number): string =>
      `Worker ${workerPid} - Database connection established successfully`,
    modelsSynchronized: (workerPid: number, modelCount: number): string =>
      `Worker ${workerPid} - ${modelCount} database models synchronized`,
    initializationFailed: (workerPid: number): string =>
      `Worker ${workerPid} - Failed to initialize database`,
  },
};
