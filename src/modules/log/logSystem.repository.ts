// import { RootRepository } from '@infrastructure/repository/rootRepository';
// import { LogSystem } from './logSystem.model';

// export class LogSystemRepository extends RootRepository<LogSystem> {
//   constructor() {
//     super(LogSystem);
//   }

//     public async addLog(options: InsertLogAuditOptions, transaction?: Transaction): Promise<void> {
//       await this.create(
//         {
//           userAccountCode: options.userCode,
//           action: options.action,
//           status: options.status,
//           resourceField: options.resourceField,
//           resourceName: options.resourceName,
//           code: options.code,
//         },
//         { transaction },
//       );
//     }
// }
