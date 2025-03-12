import { Transaction } from "@sequelize/core";
import { UserClaim } from "./userClaim.model";
import { UserClaimRepository } from "./userClaim.repository";

export class ClaimService {
    private userClaimRepository: UserClaimRepository = new UserClaimRepository();

    public async storeClaim(
    userAccountCode: string,
    claimType: string,
    claimValue: string,
    transaction?: Transaction
    ): Promise<UserClaim> {
    return this.userClaimRepository.create(
        {
        userAccountCode,
        claimType,
        claimValue,
        },
        { transaction }
    );
    }
}