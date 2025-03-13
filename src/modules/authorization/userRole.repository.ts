import { RootRepository } from "@infrastructure/index";
import { UserRole } from "./userRole.model";
import { Transaction } from "@sequelize/core";

export class UserRoleRepository extends RootRepository<UserRole> {
  constructor() {
    super(UserRole);
  }

  public async findOneByUser(
    userAccountCode: string
  ): Promise<UserRole | null> {
    return this.findOne({ where: { userAccountCode } });
  }

  public async findManyByUser(
    userAccountCode: string
  ): Promise<UserRole[] | null> {
    return this.findAll({ where: { userAccountCode } });
  }

  public async addRoleToUser(
    userAccountCode: string,
    roleCode: string,
    transaction?: Transaction
  ): Promise<UserRole> {
    return this.create({ userAccountCode, roleCode }, { transaction });
  }

  public async removeFromRole(
    userAccountCode: string,
    roleCode: string,
    transaction?: Transaction
  ): Promise<number> {
    return this.delete(
      { where: { userAccountCode, roleCode } },
      { transaction }
    );
  }

  public async removeUserFromAllRoles(
    userAccountCode: string,
    transaction?: Transaction
  ): Promise<number> {
    return this.delete({ where: { userAccountCode } }, { transaction });
  }

  public async isInRole(
    userAccountCode: string,
    roleCode: string
  ): Promise<boolean> {
    const { rows, count } = await this.findAllAndCount({
      where: { userAccountCode, roleCode },
    });
    return count > 0;
  }
}
