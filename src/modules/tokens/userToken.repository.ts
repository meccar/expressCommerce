import { RootRepository } from '@infrastructure/repository/rootRepository';
import { UserToken } from './userToken.model';
import { Transaction } from '@sequelize/core';

export class UserTokenRepository extends RootRepository<UserToken> {
  constructor() {
    super(UserToken);
  }

  public async addUserToken(
    userAccountCode: string,
    loginProvider: string,
    name: string,
    value: string,
    transaction?: Transaction,
  ): Promise<UserToken> {
    return this.create({ userAccountCode, loginProvider, name, value }, { transaction });
  }
}
