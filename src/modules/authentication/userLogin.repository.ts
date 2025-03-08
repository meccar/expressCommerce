import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserLogin } from "./userLogin.model";

export class UserLoginRepository extends RootRepository<UserLogin> {
    constructor() {
        super(UserLogin)
    }
}