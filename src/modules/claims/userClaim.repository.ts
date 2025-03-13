import { RootRepository } from '@infrastructure/repository/rootRepository';
import { UserClaim } from './userClaim.model';
import { Transaction } from '@sequelize/core';

export class UserClaimRepository extends RootRepository<UserClaim> {
  constructor() {
    super(UserClaim);
  }

  public async GetUserClaims(userAccountCode: string): Promise<UserClaim[]> {
    return await this.findAll({ where: { userAccountCode } });
  }

  public async addClaim(
    userAccountCode: string,
    claimType: string,
    claimValue: string,
    transaction?: Transaction,
  ): Promise<UserClaim> {
    return this.create({ userAccountCode, claimType, claimValue }, { transaction });
  }

  public async addClaims(
    userAccountCode: string,
    claims: Array<{ type: string; value: string }>,
    transaction?: Transaction,
  ): Promise<UserClaim[]> {
    const results: UserClaim[] = [];

    for (const claim of claims) {
      const result = await this.addClaim(userAccountCode, claim.type, claim.value, transaction);
      results.push(result);
    }

    return results;
  }

  public async removeClaim(
    userAccountCode: string,
    claimType: string,
    claimValue?: string,
  ): Promise<number> {
    const whereClause: any = { userAccountCode, claimType };

    if (claimValue) whereClause.claimValue = claimValue;

    return this.delete({ where: whereClause });
  }

  public async hasClaim(
    userAccountCode: string,
    claimType: string,
    claimValue?: string,
  ): Promise<boolean> {
    const whereClause: any = { userAccountCode, claimType };

    if (claimValue) whereClause.claimValue = claimValue;

    const { rows, count } = await this.findAllAndCount({
      where: whereClause,
    });
    return count > 0;
  }

  public async hasAnyClaim(
    userAccountCode: string,
    claims: Array<{ type: string; value?: string }>,
  ): Promise<boolean> {
    for (const claim of claims) {
      const hasClaim = await this.hasClaim(userAccountCode, claim.type, claim.value);
      if (hasClaim) return true;
    }
    return false;
  }

  public async hasAllClaims(
    userAccountCode: string,
    claims: Array<{ type: string; value?: string }>,
  ): Promise<boolean> {
    for (const claim of claims) {
      const hasClaim = await this.hasClaim(userAccountCode, claim.type, claim.value);
      if (!hasClaim) return false;
    }
    return true;
  }
}
