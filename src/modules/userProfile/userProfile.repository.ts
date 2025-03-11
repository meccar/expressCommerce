import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserProfile } from "./userProfile.model";

export class UserProfileRepository extends RootRepository<UserProfile> {
    constructor() {
        super(UserProfile)
    }
}