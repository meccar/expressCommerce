import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserToken } from "./userToken.model";

export class UserTokenRepository extends RootRepository<UserToken> {
    constructor() {
        super(UserToken)
    }
}