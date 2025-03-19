import { RootRepository } from '@infrastructure/repository/rootRepository';
import { Role } from './role.model';
import { Transaction } from '@sequelize/core';

export class RoleRepository extends RootRepository<Role> {
  constructor() {
    super(Role);
  }

  public async findByName(name: string): Promise<Role | null> {
    return this.findOne({ where: { name } });
  }

  public async createRole(name: string, transaction?: Transaction): Promise<Role> {
    return await this.create({ name }, { transaction });
  }
}
