import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import { CONFIG } from "@config/index";
import { compare, UnauthorizedException } from "@common/index";
import { Transaction } from "@sequelize/core";
import { UserAccount, UserAccountRepository } from '@modules/userAccount';
import { UserClaim } from './userClaim.model';
import { UserLogin } from './userLogin.model';
import { UserToken } from './userToken.model';
import { Secret, SignOptions } from 'jsonwebtoken';
import type { Algorithm } from "jsonwebtoken";
import { SignInResult } from '@infrastructure/index';

interface JwtPayload {
    code: string;
    email: string;
    username: string;
    claims?: Array<{type: string, value: string}>;
    providers?: Array<{provider: string, providerKey: string}>;
}

export interface SignInOptions {
    isPersistent?: boolean;
    lockoutOnFailure?: boolean;
    requireConfirmed?: boolean;
}

export class AuthenticationService {
    private readonly MAX_FAILED_ATTEMPTS = 5;
    private readonly DEFAULT_LOCKOUT_MINUTES = 15;
    private userAccountRepository: UserAccountRepository = new UserAccountRepository();

    constructor() {
        this.initializePassport();
    }

    private getJwtSecret(): Buffer {
        return Buffer.from(CONFIG.SYSTEM.JWT_SECRET, 'utf8');
    }

    private initializePassport() {
        const opts: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: this.getJwtSecret(),
        };

        passport.use(new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
            const user = await UserAccount.findOne({
                where: { code: jwt_payload.code },
                attributes: { exclude: ['password'] },
                include: [
                {
                    model: UserClaim,
                    attributes: ['claimType', 'claimVale']
                },
                {
                    model: UserLogin,
                    attributes: ['loginProvider', 'providerKey', 'providerDisplayName']
                }
                ]
            });

            if (!user) return done(null, false, { message: 'User not found' });
            

            if (!user.isActive) return done(null, false, { message: 'Account is inactive' });
            
            if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date())
                return done(null, false, { message: 'Account is locked out' });
            
            const claims = await UserClaim.findAll({
                where: { userAccountCode: user.code }
            });

            const logins = await UserLogin.findAll({
                where: { userAccountCode: user.code }
            });
                
            const userWithDetails = {
                ...user.toJSON(),
                claims: claims.map(claim => ({
                    type: claim.claimType,
                    value: claim.claimVale
                })),
                providers: logins.map(login => ({
                    provider: login.loginProvider,
                    providerKey: login.providerKey,
                    displayName: login.providerDisplayName
                }))
            }

            return done(null, userWithDetails);
        }));
    }

public async generateToken(user: UserAccount, options: { expiresIn?: string, isPersistent?: boolean, transaction?: Transaction } = {}): Promise<string> {
    const claims = await UserClaim.findAll({
        where: { userAccountCode: user.code },
        transaction: options.transaction
    });

    const logins = await UserLogin.findAll({
        where: { userAccountCode: user.code },
        transaction: options.transaction
    });

    const payload: JwtPayload = {
        code: user.code,
        email: user.email,
        username: user.username,
        claims: claims.map(claim => ({
            type: claim.claimType,
            value: claim.claimVale
        })),
        providers: logins.map(login => ({
            provider: String(login.loginProvider),
            providerKey: login.providerKey
        }))
    };

    const algorithm: Algorithm = "HS256";
    const expiresIn = options.isPersistent ? '30d' : (options.expiresIn || '1d');

    return jwt.sign(
        payload, 
        this.getJwtSecret() as Secret, 
        { 
            algorithm: algorithm,
            expiresIn: expiresIn,
        } as SignOptions
    );
}

    public verifyToken(token: string): JwtPayload {
        return jwt.verify(token, this.getJwtSecret()) as JwtPayload;
    }

    public async passwordSignInAsync(
        user: UserAccount, 
        password: string, 
        options: SignInOptions = {}
    ): Promise<SignInResult> {
        const { isPersistent = false, lockoutOnFailure = true, requireConfirmed = true } = options;
        
        if (requireConfirmed && !user.emailConfirmed)
            return { 
                succeeded: false, 
                isNotAllowed: true, 
                message: 'Email not confirmed' 
            };
        
        
        if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) 
            return { 
                succeeded: false, 
                isLockedOut: true, 
                message: 'Account is locked out' 
            };
        
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
            
            return { succeeded: false, message: 'Invalid login attempt' };
        }
        
        if (user.accessFailedCount > 0) {
            user.accessFailedCount = 0;
            user.lockoutEnd = null;
            await user.save();
        }
        
        if (user.twoFactorEnabled)
            return { 
                succeeded: false, 
                requiresTwoFactor: true,
                message: 'Two-factor authentication required' 
            };
        
        const token = await this.generateToken(user, { isPersistent });
        
        await user.save();
        
        return { succeeded: true, token };
    }

    public async storeToken(
        userAccountCode: string, 
        loginProvider: string = 'JWT',
        name: string,
        value: string, 
        transaction?: Transaction
    ): Promise<UserToken> {
        return UserToken.create({
            userAccountCode,
            loginProvider,
            name,
            value
        }, { transaction });
    }

    public async storeClaim(
        userAccountCode: string,
        claimType: string,
        claimVale: string,
        transaction?: Transaction
    ): Promise<UserClaim> {
        return UserClaim.create({
            userAccountCode,
            claimType,
            claimVale,
        }, { transaction });
    }

    public async signInWithClaimsAsync(
        userAccountCode: string,
        loginProvider: string,
        providerKey: string,
        providerDisplayName: string,
        transaction?: Transaction
    ): Promise<UserLogin> {
        return UserLogin.create({
            userAccountCode,
            loginProvider,
            providerKey,
            providerDisplayName
        }, { transaction });
    }

    public async validateExternalProviderToken(loginProvider: string, providerKey: string): Promise<UserAccount | null> {
        const userLogin = await UserLogin.findOne({
            where: {
            loginProvider,
            providerKey
            },
            include: [{ model: UserAccount }]
        });

        if (!userLogin) return null;

        return UserAccount.findOne({
            where: { code: userLogin.userAccountCode },
            attributes: { exclude: ['password'] }
        });
    }

    public authenticate() {
        return passport.authenticate('jwt', { session: false });
    }

    public authorizeByClaims(requiredClaims: Array<{type: string, value?: string}>) {
        return async (req: any, res: any, next: any) => {
            if (!req.user.claims) {
                const claims = await UserClaim.findAll({
                where: { userAccountCode: req.user.code }
                });

                req.user.claims = claims.map(claim => ({
                type: claim.claimType,
                value: claim.claimVale
                }));
            }

        const userClaims = req.user.claims || [];

        const hasRequiredClaims = requiredClaims.every(requiredClaim => 
        userClaims.some((userClaim: { type: string; value?: string }) => 
            userClaim.type === requiredClaim.type && 
            (requiredClaim.value === undefined || userClaim.value === requiredClaim.value)
        )
        );

        if (!hasRequiredClaims) throw new UnauthorizedException("");

        next();
        };
    }
}