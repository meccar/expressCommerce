import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { Op, Transaction } from "@sequelize/core";
import { compare, encrypt } from "@common/index";
import { PasswordVerificationResult } from "@infrastructure/index";
import { CONFIG } from "@config/index";
import { AuthenticationService } from "@modules/authentication/authentication.service";
export class UserAccountRepository extends RootRepository<UserAccount> {
    private authenticationService: AuthenticationService = new AuthenticationService()

    constructor(
    ) {
        super(UserAccount);
    }

    public async findByEmailOrUsername(email?: string, username?: string): Promise<UserAccount | null> {
        const conditions = [];

        if (email) conditions.push({ email });
        if (username) conditions.push({ username });
    
        if (conditions.length === 0) return null;
    
        return await this.findOne({
            where: {
                [Op.or]: conditions
            }
        });
    }

    public async verifyPasswordAsync(user: UserAccount, password: string): Promise<(typeof PasswordVerificationResult)[keyof typeof PasswordVerificationResult]> {
        if (!(await compare(password, user.password, CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!, true)))
            return PasswordVerificationResult.Failed

        return PasswordVerificationResult.Success
    }

    public generateConcurrencyStampAsync() {
        return crypto.randomUUID()
    }

    public async createAsync(email: string, username: string, password: string, transaction: Transaction): Promise<UserAccount | null> {
        const existingUser = await this.findByEmailOrUsername(email, username);

        if (existingUser)
            return null;

        const hashedPassword = await encrypt(password, CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!, true);
        
        const userAccount = await this.create(
        {
            email,
            username,
            password: hashedPassword,
            isActive: true,
        },
        { transaction }
        );

        userAccount.password = ""
        return userAccount
    }

    public async validateUserAsync(email: string, username: string, password: string, transaction: Transaction): Promise<string | null> {
        const existingUser = await this.findByEmailOrUsername(email, username);
        if (!existingUser)
            return null;

        if (await this.verifyPasswordAsync(existingUser, password) === PasswordVerificationResult.Failed)
            return null;

        await this.authenticationService.signInWithClaimsAsync(existingUser.code, existingUser.email, existingUser.email, "Local", transaction);

        return await this.authenticationService.generateToken(existingUser, {expiresIn: "1", transaction});
    }
}