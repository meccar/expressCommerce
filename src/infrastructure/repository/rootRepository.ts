import {
  CreateOptions,
  DestroyOptions,
  FindOptions,
  Model,
  ModelStatic,
  RestoreOptions,
  Transaction,
  UpdateOptions,
  WhereOptions,
} from "@sequelize/core";

export class RootRepository<T extends Model> {
  constructor(private readonly model: ModelStatic<T>) {}

  public async findAll(
    options?: FindOptions<T> & { transaction?: Transaction }
  ): Promise<T[]> {
    return await this.model.findAll(options);
  }

  public async findAllAndCount(
    options?: FindOptions<T> & { transaction?: Transaction }
  ): Promise<{ rows: T[]; count: number }> {
    return await this.model.findAndCountAll(options);
  }

  public async findByCode(
    code: number | string,
    options?: FindOptions<T> & { transaction?: Transaction }
  ): Promise<T | null> {
    return await this.model.findByPk(code, options);
  }

  public async findOne(
    options?: FindOptions<T> & { transaction?: Transaction }
  ): Promise<T | null> {
    return await this.model.findOne(options);
  }

  public async create(
    data: Partial<T>,
    options?: CreateOptions<T> & { transaction?: Transaction }
  ): Promise<T> {
    return await this.model.create(data as any, options);
  }

  public async update(
    code: number | string,
    data: Partial<T>,
    options?: Omit<UpdateOptions<T>, "where"> & { transaction?: Transaction }
  ): Promise<[number, T[]]> {
    const [affectedCount, affectedRows] = await this.model.update(data as any, {
      where: { code } as any,
      ...options,
      returning: true,
    });

    return [affectedCount, affectedRows];
  }

  public async softDelete(
    where: WhereOptions<T>,
    options?: Omit<DestroyOptions<T>, "where"> & { transaction?: Transaction }
  ): Promise<number> {
    return await this.model.destroy({
      where,
      ...options,
    });
  }

  public async restore(
    where: WhereOptions<T>,
    options?: Omit<RestoreOptions<T>, "where"> & { transaction?: Transaction }
  ): Promise<void> {
    return await this.model.restore({
      where,
      ...options,
    });
  }
}
