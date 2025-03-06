import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserProfile } from "./userProfile.model";
import { Transaction } from "@sequelize/core";

export class UserProfileRepository extends RootRepository<UserProfile> {
    constructor() {
        super(UserProfile)
    }

    public async createAsync(userAccountCode: string, transaction: Transaction): Promise<UserProfile> {
        return await UserProfile.create(
            { userAccountCode: userAccountCode } as any,
            { transaction }
        );
    }
    
}