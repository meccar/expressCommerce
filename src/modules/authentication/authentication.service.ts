import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import * as jwt from "jsonwebtoken";
import { CONFIG } from "@config/index";
import {
  BadRequestException,
  compare,
  NotFoundException,
  Transactional,
  UnauthorizedException,
} from "@common/index";
import { Transaction } from "@sequelize/core";
import { UserAccount, UserAccountRepository } from "@modules/userAccount";
import { UserClaim } from "./userClaim.model";
import { UserLogin } from "./userLogin.model";
import { UserToken } from "./userToken.model";
import { Secret, SignOptions } from "jsonwebtoken";
import type { Algorithm } from "jsonwebtoken";
import { JwtAccessPayload, JwtRefreshPayload, SignInOptions, SignInResult } from "@infrastructure/index";
import { UserLoginRepository } from "./userLogin.repository";
import { UserClaimRepository } from "./userClaim.repository";
import { UserTokenRepository } from "./userToken.repository";
import crypto from "crypto";

export class AuthenticationService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly DEFAULT_LOCKOUT_MINUTES = 15;

  private userLoginRepository: UserLoginRepository = new UserLoginRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();

  constructor() {
    this.initializePassport();
  }

  private getJwtSecret(type: "access" | "refresh"): Buffer {
    return Buffer.from(
      type === "access"
        ? CONFIG.SYSTEM.JWT_ACCESS_SECRET
        : CONFIG.SYSTEM.JWT_REFRESH_SECRET,
      "utf8"
    );
  }

  private initializePassport() {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.getJwtSecret("access"),
      passReqToCallback: true,
    };

    passport.use(
      new JwtStrategy(opts, async (jwt_payload: JwtAccessPayload, done) => {
        const user = await this.userAccountRepository.findOne({
          where: { code: jwt_payload.code },
          attributes: { exclude: ["password"] },
          include: [
            {
              model: UserClaim,
              attributes: ["claimType", "claimVale"],
            },
            {
              model: UserLogin,
              attributes: [
                "loginProvider",
                "providerKey",
                "providerDisplayName",
              ],
            },
          ],
        });

        if (!user) throw new NotFoundException("User not found");

        if (!user.isActive)
          throw new UnauthorizedException("Account is inactive");

        if (!user.emailConfirmed)
          throw new UnauthorizedException("Email not confirmed");

        if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date())
          throw new UnauthorizedException("Account is locked out");

        const claims = await this.userClaimRepository.findAll({
          where: { userAccountCode: user.code },
        });

        const logins = await this.userLoginRepository.findAll({
          where: { userAccountCode: user.code },
        });

        const userWithDetails = {
          ...user.toJSON(),
          claims: claims.rows.map((claim) => ({
            type: claim.claimType,
            value: claim.claimValue,
          })) || [],
          providers: logins.rows.map((login) => ({
            provider: login.loginProvider,
            providerKey: login.providerKey,
            displayName: login.providerDisplayName,
          })) || [],
        };

        return done(null, userWithDetails);
      })
    );

    passport.deserializeUser(async (code: string, done) => {
      const user = await this.userAccountRepository.findOne({
        where: { code },
        attributes: {exclude: ["password"]},
      })
      done(null, user);
    })
  }

  @Transactional()
  public async login(loginData: any, transaction?: Transaction): Promise<any> {
    const {
      email,
      username,
      password,
      isPersistent,
      lockoutOnFailure,
      requireConfirmed,
    } = loginData;

    if (!((email || username) && password))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(
      email,
      username
    );

    if (!existingUser)
      throw new UnauthorizedException(
        "Either email, username or password is incorrect"
      );

    const signInResult = await this.passwordSignInAsync(
      existingUser,
      password,
      { lockoutOnFailure, requireConfirmed }
    );

    if (!signInResult.succeeded)
      throw new UnauthorizedException(signInResult.message);

    await this.signInWithClaimsAsync(
      existingUser.code,
      existingUser.email,
      existingUser.email,
      "Local",
      transaction
    );

    const tokens = await this.generateToken(existingUser, {
      expiresIn: "1d",
      isPersistent,
      transaction,
    })

    await this.storeToken(
      existingUser.code,
      'JWT',
      'RefreshToken',
      tokens.refreshToken,
      transaction
    );

    return tokens;
  }

  @Transactional()
  public async logout(logoutData: any, user: any, transaction?: Transaction): Promise<any> {
    const { refreshToken } = logoutData;

    if (!user || !refreshToken) throw new UnauthorizedException();

    const decoded = this.verifyRefreshToken(refreshToken);

    const storedToken = await this.findToken(
        decoded.code,
        'JWT',
        'RefreshToken',
        refreshToken
      )
    
    if (!storedToken || !user) throw new UnauthorizedException();
    
    await this.userTokenRepository.delete(
      { userAccountCode: user.code },
      { transaction }
    )
    
    return { message: "Logged out successfully" };
  }

  @Transactional()
  public async confirmEmail(confirmEmailData: any, transaction?: Transaction): Promise<any> {
    const { token } = confirmEmailData;
    if (!token) throw new UnauthorizedException();

    const userToken = await this.userTokenRepository.findOne({
      where: {
        loginProvider: 'email_verification',
        name: 'email_verification',
        value: token
      }
    });

    if (!userToken) 
      throw new UnauthorizedException("Invalid or expired verification token");
    
    const userAccount = await this.userAccountRepository.findOne({
      where: {
        code: userToken.userAccountCode
      }});

    if (!userAccount) throw new BadRequestException();
    
  
    await this.userAccountRepository.update(
      userAccount.code,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction }
    );
  
    await this.userTokenRepository.delete(
      { value: token },
      {transaction}
    );
  
    return { message: "Email verified successfully" };
  }

  @Transactional()
  public async refreshToken(refreshTokenData: any, transaction?: Transaction): Promise<any> {
    const {refreshToken} = refreshTokenData;

    if (!refreshToken) throw new UnauthorizedException();

    const decoded = this.verifyRefreshToken(refreshToken);

    const [storedToken, user] = await Promise.all([
      this.findToken(
        decoded.code,
        'JWT',
        'RefreshToken',
        refreshToken
      ),
      this.userAccountRepository.findOne({
        where: { code: decoded.code }
      })
    ]);
    
    if (!storedToken || !user) throw new UnauthorizedException();
    
    const tokens = await this.generateToken(user, {
      isPersistent: true,
      transaction
    });

    await this.invalidateToken(refreshToken, transaction);

    await this.storeToken(
      user.code,
      'JWT',
      'RefreshToken',
      tokens.refreshToken,
      transaction
    );

    return ({
      tokens,
      expiresIn: 1800,
    });
  }

  private async generateToken(
    user: UserAccount,
    options: {
      expiresIn?: string;
      isPersistent?: boolean;
      transaction?: Transaction;
    } = {}
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [claimsResult, loginsResult] = await Promise.all([
      this.userClaimRepository.findAll({
        where: { userAccountCode: user.code },
        transaction: options.transaction,
      }),
      this.userLoginRepository.findAll({
        where: { userAccountCode: user.code },
        transaction: options.transaction,
      }),
    ]);

    const claims = claimsResult.rows || claimsResult;
    const logins = loginsResult.rows || loginsResult;

    const accessPayload: JwtAccessPayload = {
      code: user.code,
      email: user.email || "",
      username: user.username || "",
      tokenType: "access",
      claims: Array.isArray(claims)
        ? claims.map((claim) => ({
            type: claim.claimType,
            value: claim.claimValue,
          }))
        : [],
      providers: Array.isArray(logins)
        ? logins.map((login) => ({
            provider: String(login.loginProvider),
            providerKey: login.providerKey,
          }))
        : [],
      jti: crypto.randomUUID(),
    };

    const refreshPayload: JwtRefreshPayload = {
      code: user.code,
      email: user.email || "",
      username: user.username || "",
      tokenType: "refresh",
      jti: crypto.randomUUID(),
    };

    const algorithm: Algorithm = "HS256";

    const accessExpiresIn = options.isPersistent
      ? "30m"
      : options.expiresIn || "15m";
    const refreshExpiresIn = options.isPersistent
      ? "30d"
      : options.expiresIn || "1d";

    const accessToken = jwt.sign(
      accessPayload,
      this.getJwtSecret("access") as Secret,
      {
        algorithm,
        expiresIn: accessExpiresIn,
      } as SignOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      this.getJwtSecret("refresh"),
      {
        algorithm,
        expiresIn: refreshExpiresIn,
      } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  private async findToken(
    userAccountCode: string,
    loginProvider: string = "JWT",
    name: string,
    value: string
  ): Promise<UserToken | null> {
    return this.userTokenRepository.findOne({
      where: {
        userAccountCode,
        loginProvider,
        name,
        value,
      },
    });
  }

  private async invalidateToken(
    token: string,
    transaction?: Transaction
  ): Promise<void> {
    await this.userTokenRepository.delete(
      { value: token },
      { transaction }
    );
  }

  private verifyAccessToken(token: string): JwtAccessPayload {
    return jwt.verify(token, this.getJwtSecret("access")) as JwtAccessPayload;
  }

  private verifyRefreshToken(token: string): JwtRefreshPayload {
    return jwt.verify(token, this.getJwtSecret("refresh")) as JwtRefreshPayload;
  }

  private async passwordSignInAsync(
    user: UserAccount,
    password: string,
    options: SignInOptions = {}
  ): Promise<SignInResult> {
    const { lockoutOnFailure = true, requireConfirmed = true } = options;

    if (requireConfirmed && !user.emailConfirmed)
      return {
        succeeded: false,
        isNotAllowed: true,
        message: "Email not confirmed",
      };

    if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date())
      return {
        succeeded: false,
        isLockedOut: true,
        message: "Account is locked out",
      };

    const isPasswordValid = await compare(
      password,
      user.password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true
    );

    if (!isPasswordValid) {
      if (lockoutOnFailure) {
        user.accessFailedCount = (user.accessFailedCount || 0) + 1;

        if (user.accessFailedCount >= this.MAX_FAILED_ATTEMPTS) {
          const lockoutEnd = new Date();
          lockoutEnd.setMinutes(
            lockoutEnd.getMinutes() + this.DEFAULT_LOCKOUT_MINUTES
          );
          user.lockoutEnd = lockoutEnd;
        }

        await user.save();
      }

      return { succeeded: false, message: "Invalid login attempt" };
    }

    if (user.accessFailedCount > 0) {
      user.accessFailedCount = 0;
      user.lockoutEnd = null;
      await user.save();
    }

    if (!user.twoFactorEnabled)
      return {
        succeeded: false,
        requiresTwoFactor: true,
        message: "Two-factor authentication required",
      };

    await user.save();
    return { succeeded: true };
  }

  private async storeToken(
    userAccountCode: string,
    loginProvider: string = "JWT",
    name: string,
    value: string,
    transaction?: Transaction
  ): Promise<UserToken> {
    return this.userTokenRepository.create(
      {
        userAccountCode,
        loginProvider,
        name,
        value,
      },
      { transaction }
    );
  }

  private async storeClaim(
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

  private async signInWithClaimsAsync(
    userAccountCode: string,
    loginProvider: string,
    providerKey: string,
    providerDisplayName: string,
    transaction?: Transaction
  ): Promise<UserLogin> {
    return this.userLoginRepository.create(
      {
        userAccountCode,
        loginProvider,
        providerKey,
        providerDisplayName,
      },
      { transaction }
    );
  }

  private async validateExternalProviderToken(
    loginProvider: string,
    providerKey: string
  ): Promise<UserAccount | null> {
    const userLogin = await this.userLoginRepository.findOne({
      where: {
        loginProvider,
        providerKey,
      },
      include: [{ model: UserAccount }],
    });

    if (!userLogin) return null;

    return this.userAccountRepository.findOne({
      where: { code: userLogin.userAccountCode },
      attributes: { exclude: ["password"] },
    });
  }

  private authorizeByClaims(
    requiredClaims: Array<{ type: string; value?: string }>
  ) {
    return async (req: any, res: any, next: any) => {
      if (!req.user.claims) {
        const claims = await this.userClaimRepository.findAll({
          where: { userAccountCode: req.user.code },
        });

        req.user.claims = claims.rows.map((claim) => ({
          type: claim.claimType,
          value: claim.claimValue,
        }));
      }

      const userClaims = req.user.claims || [];

      const hasRequiredClaims = requiredClaims.every((requiredClaim) =>
        userClaims.some(
          (userClaim: { type: string; value?: string }) =>
            userClaim.type === requiredClaim.type &&
            (requiredClaim.value === undefined ||
              userClaim.value === requiredClaim.value)
        )
      );

      if (!hasRequiredClaims) throw new UnauthorizedException("");

      next();
    };
  }

  private generateConcurrencyStampAsync() {
    return crypto.randomUUID();
  }
}
