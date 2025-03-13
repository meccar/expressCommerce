import { databaseService } from '@infrastructure/index';
import { Transaction } from '@sequelize/core';

export function Transactional() {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const sequelize = databaseService.sequelize;

      const hasTransaction = args.length > 0 && args[args.length - 1] instanceof Transaction;

      if (hasTransaction) return originalMethod.apply(this, args);

      return sequelize.transaction(async transaction => {
        const methodArgs = [...args, transaction];
        return originalMethod.apply(this, methodArgs);
      });
    };

    return descriptor;
  };
}
