import { RootRepository } from '@infrastructure/repository/rootRepository';
import { UserClaim } from './userClaim.model';
import { Transaction } from '@sequelize/core';

export class UserClaimRepository extends RootRepository<UserClaim> {
  constructor() {
    super(UserClaim);
  }

  public async getUserClaims(userAccountCode: string): Promise<UserClaim[]> {
    return await this.findAll({ where: { userAccountCode } });
  }

  public async getDetailClaim(
    userAccountCode: string,
    claimType: string,
  ): Promise<UserClaim | null> {
    return await this.findOne({ where: { userAccountCode, claimType } });
  }

  public async updateEmailConfirmedClaim(
    userAccountCode: string,
    claimValue: string,
    transaction?: Transaction,
  ): Promise<UserClaim[] | null> {
    const claim = await this.getDetailClaim(userAccountCode, 'EmailConfirmed');

    if (!claim) return null;
    claim.claimValue = claimValue;
    const [number, claims] = await this.update(userAccountCode, claim, {
      transaction,
    });
    return claims;
  }

  public async updateClaim(
    userAccountCode: string,
    claim: UserClaim,
    transaction?: Transaction,
  ): Promise<UserClaim[]> {
    const [number, claims] = await this.update(userAccountCode, claim, {
      transaction,
    });
    return claims;
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

    return this.softDelete({ where: whereClause });
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
