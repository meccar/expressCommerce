import { RootRepository } from '@infrastructure/repository/rootRepository';
import { UserAccount } from './userAccount.model';
import { Op, Transaction } from '@sequelize/core';

export class UserAccountRepository extends RootRepository<UserAccount> {
  constructor() {
    super(UserAccount);
  }

  public async findByEmailOrUsername(
    email?: string,
    username?: string,
  ): Promise<UserAccount | null> {
    const conditions = [];

    if (email) conditions.push({ email });
    if (username) conditions.push({ username });

    if (conditions.length === 0) return null;

    return await this.findOne({
      where: {
        [Op.or]: conditions,
      },
    });
  }

  public async findUserByToken(token: string): Promise<UserAccount | null> {
    return await this.findOne({
      where: {
        [Op.or]: [{ confirmToken: token }, { passwordRecoveryToken: token }],
      },
    });
  }
}
