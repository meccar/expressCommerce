import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserProfile } from "./userProfile.model";
import { Transaction } from "@sequelize/core";

export class UserProfileRepository extends RootRepository<UserProfile> {
    constructor() {
        super(UserProfile)
    }
}