import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { CONFIG } from '@config/index';
import {
  BadRequestException,
  compare,
  encrypt,
  NotFoundException,
  Roles,
  Transactional,
  Ulid,
  UnauthorizedException,
} from '@common/index';
import { Transaction } from '@sequelize/core';
import { UserAccount, UserAccountRepository } from '@modules/userAccount';
import { UserLogin } from './userLogin.model';
import {
  IUserClaim,
  IUserProvider,
  JwtAccessPayload,
  mailService,
  SignInOptions,
  SignInResult,
} from '@infrastructure/index';
import { UserLoginRepository } from './userLogin.repository';
import { TokenService } from '@modules/tokens/tokens.service';
import { MfaService } from '@modules/mfa/mfa.service';
import { UserClaim, UserClaimRepository } from '@modules/claims';
import { UserTokenRepository } from '@modules/tokens';

export class AuthenticationService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly DEFAULT_LOCKOUT_MINUTES = 15;

  private userLoginRepository: UserLoginRepository = new UserLoginRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private tokenService: TokenService = new TokenService();
  private mfaService: MfaService = new MfaService();

  constructor() {}

  private initializePassport() {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.tokenService.getJwtSecret('access'),
      passReqToCallback: true,
    };

    passport.use(
      new JwtStrategy(opts, async (jwt_payload: JwtAccessPayload, done) => {
        const user = await this.userAccountRepository.findOne({
          where: { code: jwt_payload.code },
          attributes: { exclude: ['password'] },
          include: [
            {
              model: UserClaim,
              attributes: ['claimType', 'claimVale'],
            },
            {
              model: UserLogin,
              attributes: ['loginProvider', 'providerKey', 'providerDisplayName'],
            },
          ],
        });

        if (!user) throw new NotFoundException('User not found');

        if (!user.isActive) throw new UnauthorizedException('Account is inactive');

        if (!user.emailConfirmed) throw new UnauthorizedException('Email not confirmed');

        if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date())
          throw new UnauthorizedException('Account is locked out');

        const claims = await this.userClaimRepository.findAll({
          where: { userAccountCode: user.code },
        });

        const logins = await this.userLoginRepository.findAll({
          where: { userAccountCode: user.code },
        });

        const userWithDetails = {
          ...user.toJSON(),
          claims:
            claims.map(claim => ({
              type: claim.claimType,
              value: claim.claimValue,
            })) || [],
          providers:
            logins.map(login => ({
              provider: login.loginProvider,
              providerKey: login.providerKey,
              displayName: login.providerDisplayName,
            })) || [],
        };

        return done(null, userWithDetails);
      }),
    );

    passport.deserializeUser(async (code: string, done) => {
      const user = await this.userAccountRepository.findOne({
        where: { code },
        attributes: { exclude: ['password'] },
      });
      done(null, user);
    });
  }

  @Transactional()
  public async login(loginData: any, transaction?: Transaction): Promise<any> {
    const { email, username, password, isPersistent, lockoutOnFailure, requireConfirmed } =
      loginData || {};

    if (!email?.trim() || !username?.trim() || !password?.trim())
      throw new BadRequestException('Please enter email, username and password');

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(email, username);

    if (!existingUser)
      throw new UnauthorizedException('Either email, username or password is incorrect');

    const signInResult = await this.passwordSignInAsync(
      existingUser,
      password,
      {
        lockoutOnFailure,
        requireConfirmed,
      },
      transaction,
    );

    if (!signInResult.succeeded) throw new UnauthorizedException(signInResult.message);

    await this.userLoginRepository.signInWithClaimsAsync(
      existingUser.code,
      existingUser.email,
      existingUser.email,
      'Local',
      transaction,
    );

    const tokens = await this.tokenService.generateTokenPair(existingUser, {
      expiresIn: isPersistent ? '1d' : '15m',
      isPersistent,
      transaction,
    });

    await this.tokenService.storeRefreshToken(existingUser.code, tokens.refreshToken, transaction);

    return tokens;
  }

  @Transactional()
  public async logout(logoutData: any, user: any, transaction?: Transaction): Promise<any> {
    const { refreshToken } = logoutData || {};

    if (!user || !refreshToken?.trim()) throw new UnauthorizedException();

    const decoded = this.tokenService.verifyRefreshToken(refreshToken);

    if (decoded.code !== user.code) throw new UnauthorizedException();

    const storedToken = await this.tokenService.findToken(
      decoded.code,
      'JWT',
      'RefreshToken',
      refreshToken,
    );

    if (!storedToken) throw new UnauthorizedException();

    return { message: 'Logged out successfully' };
  }

  @Transactional()
  public async refreshToken(refreshTokenData: any, transaction?: Transaction): Promise<any> {
    const { refreshToken } = refreshTokenData || {};

    if (!refreshToken?.trim()) throw new UnauthorizedException();

    const { user, newTokens } = await this.tokenService.refreshTokenPair(refreshToken, {
      transaction,
    });

    return {
      tokens: newTokens,
      expiresIn: 1800,
    };
  }

  public async generateTwoFactorSecret(token: string, transaction?: Transaction): Promise<any> {
    if (!token) throw new UnauthorizedException();

    const userAccount = await this.userAccountRepository.findOne({
      where: {
        confirmToken: token,
      },
    });

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    return await this.mfaService.generateSecret(userAccount, transaction);
  }

  public async verifyTwoFactorSecret(
    data: any,
    user: any,
    transaction?: Transaction,
  ): Promise<any> {
    return this.mfaService.verifySecret(data, user, transaction);
  }

  public async validateTwoFactorSecret(mfaData: any, transaction?: Transaction): Promise<any> {
    const { token, mfaToken } = mfaData || {};
    if (!token?.trim() || !mfaToken?.trim()) throw new UnauthorizedException();

    const userAccount = await this.userAccountRepository.findOne({
      where: {
        confirmToken: token,
      },
    });

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    return this.mfaService.validateToken(mfaToken, userAccount, transaction);
  }

  public async disableTwoFactorSecret(
    data: any,
    user: any,
    transaction?: Transaction,
  ): Promise<any> {
    return this.mfaService.disableSecret(data, user, transaction);
  }

  @Transactional()
  public async confirmEmail(token: string, transaction?: Transaction): Promise<any> {
    if (!token) throw new UnauthorizedException();

    const isTokenExpired = await Ulid.isExpired(token, CONFIG.SYSTEM.EMAIL_TOKEN_EXPIRY);
    if (isTokenExpired) throw new UnauthorizedException('Invalid or expired verification token');

    const userAccount = await this.userAccountRepository.findUserByToken(token);

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const updatedUserAccount = await this.userAccountRepository.update(
      userAccount,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction },
    );
    if (!updatedUserAccount) throw new BadRequestException();

    if (!userAccount.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication required');

    const updateEmailConfirmedClaim = await this.userClaimRepository.updateEmailConfirmedClaim(
      userAccount.code,
      'true',
      transaction,
    );
    if (!updateEmailConfirmedClaim) throw new BadRequestException();

    const roleClaim: IUserClaim = {
      type: 'Role',
      value: Roles.User,
    };

    await this.userClaimRepository.addClaim(
      userAccount.code,
      roleClaim.type,
      roleClaim.value,
      transaction,
    );

    const userProvider: IUserProvider = {
      name: 'Email Account',
      provider: 'Email',
      providerKey: userAccount.email,
    };

    await this.userTokenRepository.addUserToken(
      userAccount.code,
      userProvider.provider,
      userProvider.name!,
      userProvider.providerKey,
      transaction,
    );

    return { message: 'Email verified successfully' };
  }

  @Transactional()
  public async resetPasswordRequest(email: string, transaction?: Transaction): Promise<any> {
    const userAccount = await this.userAccountRepository.findOne({
      where: {
        email,
      },
    });

    if (!userAccount) throw new UnauthorizedException();

    const updatedUserAccount = await this.userAccountRepository.update(
      userAccount,
      {
        passwordRecoveryToken: Ulid.generateUlid(),
      },
      { transaction },
    );

    if (!updatedUserAccount) throw new BadRequestException();

    const RecoveryUrl = `${CONFIG.SYSTEM.FRONTEND_URL}/recover-email?token=${userAccount.confirmToken}`;

    await mailService.send(email, 'Reset password', 'email-recovery', {
      username: userAccount.username ?? email,
      RecoveryUrl,
    });
  }

  @Transactional()
  public async resetPassword(
    resetPasswordData: any,
    token: string,
    transaction?: Transaction,
  ): Promise<any> {
    let { password } = resetPasswordData || {};

    if (!token || !password?.trim()) throw new UnauthorizedException();

    const isTokenExpired = await Ulid.isExpired(token, CONFIG.SYSTEM.REFRESH_PASSWORD_TOKEN_EXPIRY);
    if (isTokenExpired) throw new UnauthorizedException('Invalid or expired verification token');

    const userAccount = await this.userAccountRepository.findUserByToken(token);

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const hashedPassword = await encrypt(
      password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true,
    );

    const updatedUserAccount = await this.userAccountRepository.update(
      userAccount,
      {
        password: hashedPassword,
        passwordRecoveryToken: null,
      },
      { transaction },
    );

    if (!updatedUserAccount) throw new BadRequestException();

    password = '';
    resetPasswordData.password = '';
  }

  public async verifyToken(token: string): Promise<boolean> {
    const userAccount = await this.userAccountRepository.findUserByToken(token);

    if (!userAccount) throw new UnauthorizedException();

    return true;
  }

  private async passwordSignInAsync(
    user: UserAccount,
    password: string,
    options: SignInOptions = {},
    transaction?: Transaction,
  ): Promise<SignInResult> {
    const { lockoutOnFailure = true, requireConfirmed = true } = options;

    if (requireConfirmed && !user.emailConfirmed)
      return {
        succeeded: false,
        isNotAllowed: true,
        message: 'Email not confirmed',
      };

    if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date())
      return {
        succeeded: false,
        isLockedOut: true,
        message: 'Account is locked out',
      };

    const isPasswordValid = await compare(
      password,
      user.password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true,
    );

    if (!isPasswordValid) {
      if (lockoutOnFailure) {
        const accessFailedCount = (user.accessFailedCount || 0) + 1;
        const updates: Partial<UserAccount> = { accessFailedCount };

        if (accessFailedCount >= this.MAX_FAILED_ATTEMPTS) {
          const lockoutEnd = new Date();
          lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.DEFAULT_LOCKOUT_MINUTES);
          user.lockoutEnd = lockoutEnd;
        }

        const updatedUserAccount = await this.userAccountRepository.update(user, updates, {
          transaction,
        });

        if (!updatedUserAccount) throw new BadRequestException();
      }

      return { succeeded: false, message: 'Invalid login attempt' };
    }

    if (user.accessFailedCount > 0) {
      const updatedUserAccount = await this.userAccountRepository.update(
        user,
        {
          accessFailedCount: 0,
          lockoutEnd: null,
        },
        { transaction },
      );

      if (!updatedUserAccount) throw new BadRequestException();
    }

    if (!user.twoFactorEnabled)
      return {
        succeeded: false,
        requiresTwoFactor: true,
        message: 'Two-factor authentication required',
      };

    return { succeeded: true };
  }

  private async validateExternalProviderToken(
    loginProvider: string,
    providerKey: string,
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
      attributes: { exclude: ['password'] },
    });
  }

  private authorizeByClaims(requiredClaims: Array<{ type: string; value?: string }>) {
    return async (req: any, res: any, next: any) => {
      if (!req.user.claims) {
        const claims = await this.userClaimRepository.findAll({
          where: { userAccountCode: req.user.code },
        });

        req.user.claims = claims.map(claim => ({
          type: claim.claimType,
          value: claim.claimValue,
        }));
      }

      const userClaims = req.user.claims || [];

      const hasRequiredClaims = requiredClaims.every(requiredClaim =>
        userClaims.some(
          (userClaim: { type: string; value?: string }) =>
            userClaim.type === requiredClaim.type &&
            (requiredClaim.value === undefined || userClaim.value === requiredClaim.value),
        ),
      );

      if (!hasRequiredClaims) throw new UnauthorizedException('');

      next();
    };
  }
}
