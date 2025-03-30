import { RepositoryEvent, repositoryEventBus } from '@common/index';
import { LogOptions } from '@modules/log/log.service';
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

export class RootRepository<T extends Model> {
  constructor(private readonly model: ModelStatic<T>) {}

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

    if (created) {
      repositoryEventBus.emit(RepositoryEvent.CREATED, {
        model: this.model,
        instance,
        data: options.defaults,
        options,
      });
    }

    return instance;
  }

  public async create(
    data: Partial<T>,
    options?: CreateOptions<T> & { transaction?: Transaction; logOptions?: LogOptions },
  ): Promise<T> {
    const newRecord = await this.model.create(data as any, options);

    repositoryEventBus.emit(RepositoryEvent.CREATED, {
      model: this.model,
      instance: newRecord,
      data,
      options,
    });

    return newRecord;
  }

  public async update(
    currentRecord: T,
    data: Partial<T>,
    options?: Omit<CreateOptions<T>, 'where'> & {
      transaction?: Transaction;
      logOptions?: LogOptions;
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

    await currentRecord.destroy({
      transaction: options?.transaction,
    });

    repositoryEventBus.emit(RepositoryEvent.UPDATED, {
      model: this.model,
      oldInstance: currentRecord,
      newInstance: newRecord,
      data,
      options,
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
    const currentRecord = options?.logOptions
      ? await this.model.findOne({ where, ...options })
      : null;

    const result = await this.model.destroy({
      where,
      ...options,
    });

    if (currentRecord) {
      repositoryEventBus.emit(RepositoryEvent.DELETED, {
        model: this.model,
        instance: currentRecord,
        count: result,
        options,
      });
    }

    return result;
  }

  public async restore(
    where: WhereOptions<T>,
    options?: Omit<RestoreOptions<T>, 'where'> & {
      transaction?: Transaction;
      logOptions?: LogOptions;
    },
  ): Promise<void> {
    await this.model.restore({
      where,
      ...options,
    });

    if (options?.logOptions) {
      const restoredRecord = await this.model.findOne({
        where,
        ...options,
      });

      if (restoredRecord) {
        repositoryEventBus.emit(RepositoryEvent.RESTORED, {
          model: this.model,
          instance: restoredRecord,
          options,
        });
      }
    }
  }
}
