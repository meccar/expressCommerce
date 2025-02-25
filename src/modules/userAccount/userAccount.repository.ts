import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";

export class UserAccountRepository extends RootRepository<UserAccount> {
    constructor() {
        super(UserAccount);
    }

    public async findByEmail(email: string) {
        return this.findOne({ where: { email } });
    }
}