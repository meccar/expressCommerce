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
    options: FindOrCreateOptions<T> & { transaction?: Transaction },
  ): Promise<T> {
    const [instance] = await this.model.findOrCreate(options);
    return instance;
  }

  public async create(
    data: Partial<T>,
    options?: CreateOptions<T> & { transaction?: Transaction },
  ): Promise<T> {
    return await this.model.create(data as any, options);
  }

  public async update(
    currentRecord: T,
    data: Partial<T>,
    options?: Omit<CreateOptions<T>, 'where'> & { transaction?: Transaction },
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

    return newRecord;
  }

  public async softDelete(
    where: WhereOptions<T>,
    options?: Omit<DestroyOptions<T>, 'where'> & { transaction?: Transaction },
  ): Promise<number> {
    return await this.model.destroy({
      where,
      ...options,
    });
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
