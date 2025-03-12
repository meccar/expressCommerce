import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserClaim } from "./userClaim.model";

export class UserClaimRepository extends RootRepository<UserClaim> {
    constructor() {
        super(UserClaim)
    }

    public async GetUserClaims(userAccountCode: string): Promise<UserClaim[]> {
        return await this.findAll({where: {userAccountCode}});
    }

    public async hasClaim(userAccountCode: string, claimType: string, claimValue?: string): Promise<boolean> {
        const whereClause: any = { userAccountCode, claimType };
        
        if (claimValue) whereClause.claimValue = claimValue;
        
        const {rows, count} = await this.findAllAndCount({ where: whereClause });
        return count > 0;
    }

    public async addClaim(userAccountCode: string, claimType: string, claimValue: string): Promise<UserClaim> {
        return this.create({ userAccountCode, claimType, claimValue });
    }
    
    public async removeClaim(userAccountCode: string, claimType: string, claimValue?: string): Promise<number> {
        const whereClause: any = { userAccountCode, claimType };
        
        if (claimValue) whereClause.claimValue = claimValue;
        
        return this.delete({ where: whereClause });
    }
}