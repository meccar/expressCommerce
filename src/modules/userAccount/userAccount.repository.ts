import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { Op, Transaction } from "@sequelize/core";
import { compare, encrypt } from "@common/index";
import { PasswordVerificationResult } from "@infrastructure/index";
import { CONFIG } from "@config/index";
import { AuthenticationService, SignInOptions } from "@modules/authentication/authentication.service";
export class UserAccountRepository extends RootRepository<UserAccount> {
    private authenticationService: AuthenticationService = new AuthenticationService()
    private readonly MAX_FAILED_ATTEMPTS = 5;
    private readonly DEFAULT_LOCKOUT_MINUTES = 15;
    
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

    public async verifyPasswordAsync(user: UserAccount, password: string, options: SignInOptions = {}): Promise<(typeof PasswordVerificationResult)[keyof typeof PasswordVerificationResult]> {
        const { isPersistent = false, lockoutOnFailure = true, requireConfirmed = true } = options;

        if (requireConfirmed && !user.emailConfirmed)
            return PasswordVerificationResult.Failed
        
        
        if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) 
            return PasswordVerificationResult.Failed

        const isPasswordValid = await compare(password, user.password, CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!, true);

        if (!isPasswordValid) {
            if (lockoutOnFailure) {
                user.accessFailedCount = (user.accessFailedCount || 0) + 1;
                
                if (user.accessFailedCount >= this.MAX_FAILED_ATTEMPTS) {
                    const lockoutEnd = new Date();
                    lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.DEFAULT_LOCKOUT_MINUTES);
                    user.lockoutEnd = lockoutEnd;
                }
                
                await user.save();
            }
            
            return PasswordVerificationResult.Failed
        }

        if (user.accessFailedCount > 0) {
            user.accessFailedCount = 0;
            user.lockoutEnd = null;
            await user.save();
        }

        if (user.twoFactorEnabled)
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

    public async validateUserAsync(email: string, username: string, password: string, options: SignInOptions = {}, transaction: Transaction): Promise<string | null> {
        const existingUser = await this.findByEmailOrUsername(email, username);
        if (!existingUser)
            return null;
        const result = await this.authenticationService.passwordSignInAsync(existingUser, password, options)
        
        if (!result.succeeded)
            return null;

        await this.authenticationService.signInWithClaimsAsync(existingUser.code, existingUser.email, existingUser.email, "Local", transaction);

        return await this.authenticationService.generateToken(existingUser, {expiresIn: "1", transaction});
    }
}