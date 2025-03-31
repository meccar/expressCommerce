import { RootRepository } from '@infrastructure/repository/rootRepository';
import { LogAudit } from './logAudit.model';
import { Transactional } from '@common/decorators';
import { Transaction } from '@sequelize/core';
import { InsertLogAuditOptions } from '@infrastructure/interfaces/log.interface';

export class LogAuditRepository extends RootRepository<LogAudit> {
  constructor() {
    super(LogAudit);
  }

  public async addLog(options: InsertLogAuditOptions, transaction?: Transaction): Promise<void> {
    await this.create(
      {
        userAccountCode: options.userAccountCode,
        action: options.action,
        status: options.status,
        resourceField: options.resourceField,
        resourceName: options.resourceName,
      },
      { transaction },
    );
  }
}
