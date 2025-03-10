import { CreateOptions, DestroyOptions, FindOptions, Model, ModelStatic, Transaction, UpdateOptions, WhereOptions } from "@sequelize/core";

export class RootRepository<T extends Model> {
    constructor( 
        private readonly model: ModelStatic<T>
    ) {
    };

    public async findAll(options?: FindOptions<T> & { transaction?: Transaction }): Promise<{ rows: T[]; count: number }> {
        return await this.model.findAndCountAll(options);
    }

    public async findById(id: number | string, options?: FindOptions<T> & { transaction?: Transaction }): Promise<T | null> {
        return await this.model.findByPk(id, options);
    }

    public async findOne(options?: FindOptions<T> & { transaction?: Transaction }): Promise<T | null> {
        return await this.model.findOne(options);
    } 

    public async create(data: Partial<T>, options?: CreateOptions<T> & { transaction?: Transaction }): Promise<T> {
        return await this.model.create(data as any, options)
    }

    public async update(id: number | string ,data: Partial<T>, options?: UpdateOptions<T> & { transaction?: Transaction }): Promise<[number, T[]]> {
        const [affectedCount, affectedRows] = await this.model.update(data as any, {
            where: {id} as any,
            ...options,
            returning: true
        });

        return [affectedCount, affectedRows];
    }

    public async delete(where: WhereOptions<T>, options?: DestroyOptions<T> & { transaction?: Transaction }): Promise<number> {
        return await this.model.destroy({
            where,
            ...options
        })
    }
}