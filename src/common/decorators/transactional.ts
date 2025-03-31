import { databaseService } from '@infrastructure/index';
import { Transaction } from '@sequelize/core';

export function Transactional() {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const sequelize = databaseService.sequelize;

      const lastArg = args.length > 0 ? args[args.length - 1] : null;
      const hasTransaction = lastArg instanceof Transaction;

      if (hasTransaction) {
        (lastArg as Transaction).afterCommit(() => {});
        return originalMethod.apply(this, args);
      }

      return sequelize.transaction(async transaction => {
        const methodArgs = hasTransaction
          ? [...args.slice(0, -1), transaction]
          : [...args, transaction];
        return originalMethod.apply(this, methodArgs);
      });
    };

    return descriptor;
  };
}
