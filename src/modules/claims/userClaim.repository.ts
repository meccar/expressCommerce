import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserClaim } from "./userClaim.model";

export class UserClaimRepository extends RootRepository<UserClaim> {
    constructor() {
        super(UserClaim)
    }
}