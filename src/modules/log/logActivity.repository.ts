import { RootRepository } from '@infrastructure/repository/rootRepository';
import { LogActivity } from './logActivity.model';
import { Transaction } from '@sequelize/core';
import { InsertLogActivityOptions } from '@infrastructure/interfaces/log.interface';

export class LogActivityRepository extends RootRepository<LogActivity> {
  constructor() {
    super(LogActivity);
  }

  public async addLog(options: InsertLogActivityOptions, transaction?: Transaction): Promise<void> {
    // const sanitizedNewValue = options.newValue
    //   ? JSON.parse(JSON.stringify(options.newValue))
    //   : null;
    const changedValues = this.extractChangedValues(options.oldValue, options.newValue);

    await this.create(
      {
        userAccountCode: options.userAccountCode,
        action: options.action,
        resourceName: options.model.toString(),
        code: options.code,
        newValue: JSON.stringify(changedValues.newValues),
        oldValue: JSON.stringify(changedValues.oldValues),
      },
      { transaction },
    );
  }

  private extractChangedValues(oldData: any, newData: any): { oldValues: any; newValues: any } {
    const oldValues: any = {};
    const newValues: any = {};

    Object.keys(newData).forEach(key => {
      if (
        oldData[key] !== newData[key] &&
        newData[key] !== undefined &&
        typeof newData[key] !== 'function'
      ) {
        oldValues[key] = oldData[key];
        newValues[key] = newData[key];
      }
    });

    return { oldValues, newValues };
  }
}
