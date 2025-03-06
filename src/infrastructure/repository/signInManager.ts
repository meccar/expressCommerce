import { ExternalLoginInfo, PasswordVerificationResult, SignInResult } from "@infrastructure/index";
import { AuthenticationService } from "../../modules/authentication/authentication.service";
import { UserAccount, UserAccountRepository } from "@modules/userAccount";
import bcrypt from "bcrypt";
import { Transaction } from "@sequelize/core";
import crypto from 'crypto';
import { Request } from 'express';

export class SignInManager<TUser extends object>  {
    private LoginProviderKey: string = "LoginProvider";
    private XsrfKey: string = "XsrfId";

    // private TwoFactorAuthenticationInfo? _twoFactorInfo;
    constructor(
        // private readonly IUserConfirmation<TUser> _confirmation;
    
    private readonly authService: AuthenticationService,
    private readonly userAccountRepository: UserAccountRepository,
    ) {
        this.userAccountRepository = userAccountRepository;
    }

    // public async CreateUserPrincipalAsync(TUser user): ClaimsPrincipal 
    // {
    //     await ClaimsFactory.CreateAsync(user)
    // };

    public IsSignedIn(req: Request): boolean
    {
        return req.user !== undefined && req.isAuthenticated?.() === true
    }


    public async passwordSignInAsync(
        password: string, 
        rememberMe: boolean = false,
        lockoutOnFailure: boolean = true,
        username?: string,
        email?: string,
    ): Promise<SignInResult> {
        const user = await this.userAccountRepository.findByEmailOrUsername(email, username);

        if (!user) return { succeeded: false };

        if (!user.isActive) 
            return { succeeded: false, isNotAllowed: true };

        if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) 
            return { succeeded: false, isLockedOut: true };

        const passwordValid = await this.userAccountRepository.verifyPasswordAsync(user, password);
        
        if (passwordValid !== PasswordVerificationResult.Success) {
            if (lockoutOnFailure) 
                await this.incrementAccessFailedCount(user);
            
            return { succeeded: false };
        }

        if (user.accessFailedCount > 0)
            await this.resetAccessFailedCount(user);

        if (user.twoFactorEnabled) 
            return { succeeded: false, requiresTwoFactor: true };

        const expiresIn = rememberMe ? '30d' : '1d';
        const token = await this.authService.generateToken(user, { expiresIn });

        return { succeeded: true, token };
    }

    public async externalLoginSignInAsync(
        loginProvider: string,
        providerKey: string,
        rememberMe: boolean = false
    ): Promise<SignInResult> {
        const user = await this.authService.validateExternalProviderToken(loginProvider, providerKey);
        
        if (!user)
            return { succeeded: false };

        if (!user.isActive) 
            return {  succeeded: false, isNotAllowed: true };

        if (user.twoFactorEnabled) 
            return { succeeded: false, requiresTwoFactor: true };

        const expiresIn = rememberMe ? '30d' : '1d';
        const token = await this.authService.generateToken(user, { expiresIn });

        return { succeeded: true, token };
    }

    public async createUserFromExternalProviderAsync(
        email: string,
        username: string,
        externalLogin: ExternalLoginInfo,
        transaction?: Transaction
    ): Promise<SignInResult> {
        let createdUser = null;

        createdUser = await UserAccount.create({
            email,
            username,
            password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
            securityStamp: crypto.randomUUID(),
            passwordRecoveryToken: '',
            confirmToken: '',
            isActive: true,
            emailConfirmed: true,
            phoneNumber: '',
            phoneNumberConfirmed: false,
            twoFactorEnabled: false,
            twoFactorSecret: '',
            isTwoFactorVerified: false,
            lockoutEnd: new Date(0),
            lockoutEnabled: false,
            accessFailedCount: 0
        }, { transaction });

        await this.authService.signInWithClaimsAsync(
        createdUser.code,
        externalLogin.loginProvider,
        externalLogin.providerKey,
        externalLogin.providerDisplayName,
        transaction
        );

        if (externalLogin.claims && externalLogin.claims.length > 0) {
            await Promise.all(
                externalLogin.claims.map(claim => 
                this.authService.storeClaim(
                    createdUser.code,
                    claim.type,
                    claim.value,
                    transaction
                )
                )
            );
        }

        const token = await this.authService.generateToken(createdUser);

        return {
            succeeded: true,
            token,
        };
    }

    public async twoFactorSignInAsync(
        userCode: string, 
        twoFactorCode: string,
        rememberMe: boolean = false
    ): Promise<SignInResult> {
        const user = await UserAccount.findOne({ 
            where: { code: userCode },
            attributes: { exclude: ['password'] }
        });

        if (!user || !user.twoFactorEnabled)
            return { succeeded: false };

        const isValidCode = await this.verifyTwoFactorCode(user, twoFactorCode);
        
        if (!isValidCode)
            return { succeeded: false };

        const expiresIn = rememberMe ? '30d' : '1d';
        const token = await this.authService.generateToken(user, { expiresIn });

        return { succeeded: true, token };
    }

    public async refreshTokenAsync(token: string): Promise<SignInResult> {
        const payload = this.authService.verifyToken(token);
        
        const user = await UserAccount.findOne({
            where: { code: payload.code },
            attributes: { exclude: ['password'] }
        });

        if (!user || !user.isActive) 
            return { succeeded: false };
        
        const newToken = await this.authService.generateToken(user);

        return { succeeded: true, token: newToken };
    }


    private async verifyTwoFactorCode(user: UserAccount, code: string): Promise<boolean> {
        return code === '123456';
    }

    private async incrementAccessFailedCount(user: UserAccount): Promise<void> {
        user.accessFailedCount += 1;
        
        if (user.accessFailedCount >= 5) {
        const lockoutEnd = new Date();
        lockoutEnd.setMinutes(lockoutEnd.getMinutes() + 15);
        user.lockoutEnd = lockoutEnd;
        }
        
        await user.save();
    }

    private async resetAccessFailedCount(user: UserAccount): Promise<void> {
        user.accessFailedCount = 0;
        user.lockoutEnd = new Date(0);
        await user.save();
    }
}