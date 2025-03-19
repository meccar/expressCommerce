import { RootRepository } from '@infrastructure/repository/rootRepository';
import { RoleClaim } from './roleClaim.model';
import { Transaction } from '@sequelize/core';
import { Permission } from '@infrastructure/index';

export class RoleClaimRepository extends RootRepository<RoleClaim> {
  constructor() {
    super(RoleClaim);
  }

  public async getRoleClaims(roleCode: string): Promise<RoleClaim[]> {
    return this.findAll({ where: { roleCode } });
  }

  public async addClaim(
    roleCode: string,
    claimType: string,
    claimValue: Permission,
    transaction?: Transaction,
  ): Promise<RoleClaim> {
    return this.create({ roleCode, claimType, claimValue }, { transaction });
  }

  public async removeClaim(
    roleCode: string,
    claimType: string,
    claimValue?: string,
  ): Promise<number> {
    const whereClause: any = { roleCode, claimType };

    if (claimValue) whereClause.claimValue = claimValue;

    return this.softDelete({ where: whereClause });
  }

  public async hasClaim(
    roleCode: string,
    claimType: string,
    claimValue?: string,
  ): Promise<boolean> {
    const whereClause: any = { roleCode, claimType };

    if (claimValue) whereClause.claimValue = claimValue;

    const { count } = await this.findAllAndCount({ where: whereClause });
    return count > 0;
  }
}
