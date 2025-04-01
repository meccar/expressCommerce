import { RootRepository } from '@infrastructure/repository/rootRepository';
import { LogAudit } from './logAudit.model';
import { Transactional } from '@common/decorators';
import { Transaction } from '@sequelize/core';
import { InsertLogAuditOptions } from '@infrastructure/interfaces/log.interface';
import { LogStatus } from '@common/constants';
interface ILogAuditRepository {
  log: (status: LogStatus) => Promise<any>;
}
export class LogAuditRepository extends RootRepository<LogAudit> {
  constructor() {
    super(LogAudit);
  }

  public async addLog(
    options: Omit<InsertLogAuditOptions, 'status'>,
    transaction?: Transaction,
  ): Promise<ILogAuditRepository> {
    return {
      log: async (status: LogStatus) =>
        await this.create(
          {
            ...options,
            status,
          },
          { transaction },
        ),
    };
  }
}
