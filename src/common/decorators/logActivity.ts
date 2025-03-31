import { TableNames } from '@common/constants';
import { LogActivityRepository } from '@modules/log/logActivity.repository';
import { Transaction } from '@sequelize/core';

const logActivityRepository = new LogActivityRepository();

export function LogActivity(action: number, model: TableNames, getOldValue?: (args: any[]) => any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const oldValue = getOldValue ? getOldValue(args) : null;
      const result = await originalMethod.apply(this, args);

      const userAccount = args.find(arg => arg && typeof arg === 'object' && 'code' in arg);
      const transaction = args.find(arg => arg instanceof Transaction);
      if (userAccount && result) {
        await logActivityRepository.addLog(
          {
            userAccountCode: userAccount.code,
            action,
            model,
            newValue: result,
            oldValue: oldValue,
          },
          transaction,
        );
      }

      return result;
    };

    return descriptor;
  };
}
