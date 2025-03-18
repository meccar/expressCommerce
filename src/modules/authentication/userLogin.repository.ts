import { RootRepository } from '@infrastructure/repository/rootRepository';
import { UserLogin } from './userLogin.model';
import { Transaction } from '@sequelize/core';

export class UserLoginRepository extends RootRepository<UserLogin> {
  constructor() {
    super(UserLogin);
  }

  public async signInWithClaimsAsync(
    userAccountCode: string,
    loginProvider: string,
    providerKey: string,
    providerDisplayName: string,
    transaction?: Transaction,
  ): Promise<UserLogin> {
    const existingUserLogin = await this.findOne({
      where: { userAccountCode, loginProvider, providerKey, providerDisplayName },
    });

    if (existingUserLogin) return existingUserLogin;

    return await this.create(
      {
        userAccountCode,
        loginProvider,
        providerKey,
        providerDisplayName,
      },
      { transaction },
    );
  }
}
