// import { BaseRoute } from '@common/utils';
// import { LoggingService } from './log.service';
// import express, { Request, Response } from 'express';
// import { Api } from '@common/constants';
// import { LogActivityRepository } from './logActivity.repository';
// import { LogAuditRepository } from './logAudit.repository';

// export class LogRoute extends BaseRoute {
//   private readonly logService: LoggingService;

//   constructor(router: express.Router) {
//     super(router, Api.service.log);
//     this.logService = new LoggingService(new LogActivityRepository(), new LogAuditRepository());
//     this.initializeRoutes();
//   }

//   private initializeRoutes(): void {}
// }
