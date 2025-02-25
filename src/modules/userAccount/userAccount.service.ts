import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { databaseService } from "@infrastructure/index";

export class UserAccountService extends RootRepository<UserAccount> {
    constructor() {
        super(UserAccount);
    }
    private sequelize = databaseService.sequelize;
    
    public async register(userData: any) :  Promise<any> {
        const { email, userName, password, phoneNumber } = userData;

        const existingUser = await this.findOne({ where: { email } });
        if (existingUser) {
        //   throw new BadRequestError('Email already in use');
        }

        return this.create(userData);
    }
}