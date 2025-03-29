import {
  InsertLogActivityOptions,
  InsertLogAuditOptions,
} from '@infrastructure/interfaces/log.interface';
import { LogAction } from '@modules/index';
import {
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  FindOptions,
  FindOrCreateOptions,
  Model,
  ModelStatic,
  RestoreOptions,
  Transaction,
  UpdateOptions,
  WhereOptions,
} from '@sequelize/core';

export interface ILoggerActivity {
  log(options: {
    action: number;
    model: ModelStatic<Model>;
    code?: string;
    oldValue?: any;
    newValue?: any;
    userAccountCode?: string;
    transaction?: Transaction;
  }): Promise<void>;
}

export interface LogOptions {
  userAccountCode: string;
  useActivityLog?: boolean;
  useAuditLog?: boolean;
  status?: number;
  resourceName?: string;
  resourceField?: string;
}

export interface ILoggerActivity {
  addLog(options: InsertLogActivityOptions, transaction?: Transaction): Promise<void>;
}

export interface ILoggerAudit {
  addLog(options: InsertLogAuditOptions, transaction?: Transaction): Promise<void>;
}

export class RootRepository<T extends Model> {
  constructor(
    private readonly model: ModelStatic<T>,
    private readonly loggerActivity?: ILoggerActivity,
    private readonly loggerAudit?: ILoggerAudit,
  ) {}

  private async logAction(
    action: number,
    code: string | undefined,
    oldValue?: any,
    newValue?: any,
    options?: {
      transaction?: Transaction;
      logOptions?: LogOptions;
    },
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (!code || !options?.logOptions?.userAccountCode) return;

    if (options?.logOptions?.useActivityLog && this.loggerActivity) {
      promises.push(
        this.loggerActivity.addLog(
          {
            userAccountCode: options.logOptions.userAccountCode,
            action,
            model: this.model,
            code,
            oldValue,
            newValue,
          },
          options.transaction,
        ),
      );
    }

    if (options?.logOptions?.useAuditLog && this.loggerAudit) {
      promises.push(
        this.loggerAudit.addLog(
          {
            userAccountCode: options.logOptions.userAccountCode,
            action,
            model: this.model,
            resourceName: options.logOptions.resourceName || this.model.name,
            resourceField: options.logOptions.resourceField,
            status: options.logOptions.status || 1,
            code,
          },
          options.transaction,
        ),
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  public async findAll(options?: FindOptions<T> & { transaction?: Transaction }): Promise<T[]> {
    return await this.model.findAll(options);
  }

  public async findAllAndCount(
    options?: FindOptions<T> & { transaction?: Transaction },
  ): Promise<{ rows: T[]; count: number }> {
    return await this.model.findAndCountAll(options);
  }

  public async findByCode(
    code: number | string,
    options?: FindOptions<T> & { transaction?: Transaction },
  ): Promise<T | null> {
    return await this.model.findByPk(code, options);
  }

  public async findOne(
    options?: FindOptions<T> & { transaction?: Transaction },
  ): Promise<T | null> {
    return await this.model.findOne(options);
  }

  public async findOrCreate(
    options: FindOrCreateOptions<T> & { transaction?: Transaction; logOptions?: LogOptions },
  ): Promise<T> {
    const [instance, created] = await this.model.findOrCreate(options);

    if (created && options.logOptions)
      await this.logAction(LogAction.Create, (instance as any).code, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });

    return instance;
  }

  public async create(
    data: Partial<T>,
    options?: CreateOptions<T> & { transaction?: Transaction; logOptions?: LogOptions },
  ): Promise<T> {
    const newRecord = await this.model.create(data as any, options);

    if (options?.logOptions)
      await this.logAction(LogAction.Create, (newRecord as any).code, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });

    return newRecord;
  }

  public async update(
    currentRecord: T,
    data: Partial<T>,
    options?: Omit<CreateOptions<T>, 'where'> & {
      logOptions?: LogOptions;
      transaction?: Transaction;
    },
  ): Promise<T> {
    const currentData = currentRecord.toJSON();

    const newRecord = await this.create(
      {
        ...currentData,
        ...data,
        version: (currentData.version || 0) + 1,
        id: undefined,
      },
      options,
    );

    if (options?.logOptions)
      await this.logAction(LogAction.Update, (currentRecord as any).code, currentData, data, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });

    await currentRecord.destroy({
      transaction: options?.transaction,
    });

    return newRecord;
  }

  public async softDelete(
    where: WhereOptions<T>,
    options?: Omit<DestroyOptions<T>, 'where'> & {
      transaction?: Transaction;
      logOptions?: LogOptions;
    },
  ): Promise<number> {
    if (options?.logOptions) {
      const currentRecord = await this.model.findOne({
        where,
        ...options,
      });

      await this.logAction(LogAction.Delete, (currentRecord as any).code, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });
    }

    const result = await this.model.destroy({
      where,
      ...options,
    });

    return result;
  }

  public async restore(
    where: WhereOptions<T>,
    options?: Omit<RestoreOptions<T>, 'where'> & { transaction?: Transaction },
  ): Promise<void> {
    return await this.model.restore({
      where,
      ...options,
    });
  }
}
