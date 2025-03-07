import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { Op, Transaction } from "@sequelize/core";
import { compare, encrypt } from "@common/index";

import { CONFIG } from "@config/index";

export class UserAccountRepository extends RootRepository<UserAccount> {

  constructor() {
    super(UserAccount);
  }

  public async findByEmailOrUsername(
    email?: string,
    username?: string
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

  public generateConcurrencyStampAsync() {
    return crypto.randomUUID();
  }

  public async createAsync(
    email: string,
    username: string,
    password: string,
    transaction: Transaction
  ): Promise<UserAccount | null> {
    const hashedPassword = await encrypt(
      password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true
    );

    const userAccount = await this.create(
      {
        email,
        username,
        password: hashedPassword,
        isActive: true,
      },
      { transaction }
    );

    userAccount.password = "";
    return userAccount;
  }
}
