import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { CONFIG } from '@config/index';
import {
  BadRequestException,
  compare,
  encrypt,
  LogAction,
  LogStatus,
  NotFoundException,
  Roles,
  TableNames,
  Transactional,
  Ulid,
  UnauthorizedException,
} from '@common/index';
import { Transaction } from '@sequelize/core';
import { UserAccount, UserAccountRepository } from '@modules/userAccount';
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
import { UserClaimRepository } from '@modules/claims';
import { UserTokenRepository } from '@modules/tokens';
import { LogActivityRepository } from '@modules/log/logActivity.repository';
import { LogAuditRepository } from '@modules/log/logAudit.repository';

export class AuthenticationService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly DEFAULT_LOCKOUT_MINUTES = 15;

  private userLoginRepository: UserLoginRepository = new UserLoginRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private logActivityRepository: LogActivityRepository = new LogActivityRepository();
  private logAuditRepository: LogAuditRepository = new LogAuditRepository();
  private tokenService: TokenService = new TokenService();
  private mfaService: MfaService = new MfaService();

  constructor() {
    this.initializePassport();
  }

  private initializePassport() {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.tokenService.getJwtSecret('access'),
      passReqToCallback: true,
      ignoreExpiration: false,
    };

    passport.use(
      'jwt',
      new JwtStrategy(opts, async (req: Request, jwt_payload: JwtAccessPayload, done) => {
        if (!jwt_payload || !jwt_payload.code) {
          return done(null, false, { message: 'Invalid token' });
        }

        const user = await this.userAccountRepository.findOne({
          where: { code: jwt_payload.code },
          attributes: { exclude: ['password'] },
        });

        if (!user) return done(null, false, { message: 'Invalid token' });

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
    const { email, username, password, isPersistent } = loginData || {};

    if (!((email?.trim() || username?.trim()) && password?.trim()))
      throw new BadRequestException('Please enter email, username and password');

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(email, username);

    if (!existingUser)
      throw new UnauthorizedException('Either email, username or password is incorrect');

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: existingUser.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const signInResult = await this.passwordSignInAsync(existingUser, password, transaction);

    if (!signInResult.succeeded) {
      await audit.log(LogStatus.Denied);
      throw new UnauthorizedException(signInResult.message);
    }

    await this.userLoginRepository.signInWithClaimsAsync(
      existingUser.code,
      existingUser.email,
      existingUser.email,
      'Local',
      transaction,
    );

    const tokenCode = Ulid.generateUlid();
    const tokens = await this.tokenService.generateTokenPair(existingUser, tokenCode, {
      expiresIn: isPersistent ? '1d' : '15m',
      isPersistent,
    });

    const userToken = await this.tokenService.storeToken(
      existingUser.code,
      'JWT',
      'JWT',
      tokenCode,
      transaction,
    );
    if (!userToken) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return tokens;
  }

  @Transactional()
  public async logout(logoutData: any, user: any, transaction?: Transaction): Promise<any> {
    if (!user || !logoutData?.trim()) throw new UnauthorizedException();
    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const decoded = this.tokenService.verifyAccessToken(logoutData);

    if (decoded.code !== user.code) {
      await audit.log(LogStatus.Denied);
      throw new UnauthorizedException();
    }

    const revokeToken = await this.tokenService.revokeUserTokensByToken(
      decoded.tokenCode,
      transaction,
    );

    if (revokeToken < 1) throw new UnauthorizedException();

    await audit.log(LogStatus.Success);

    return { message: 'Logged out successfully' };
  }

  @Transactional()
  public async refreshToken(refreshTokenData: any, transaction?: Transaction): Promise<any> {
    const { refreshToken } = refreshTokenData || {};

    if (!refreshToken?.trim()) throw new UnauthorizedException();

    const result = await this.tokenService.refreshToken(refreshToken, transaction);

    if (!result.accessToken || !result.refreshToken) throw new BadRequestException();

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: result.user.code,
        action: LogAction.Update,
        model: TableNames.Role,
        resourceName: TableNames.Role,
      },
      transaction,
    );

    await audit.log(LogStatus.Success);

    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Transactional()
  public async confirmEmail(token: string, transaction?: Transaction): Promise<any> {
    if (!token) throw new UnauthorizedException();

    const isTokenExpired = await Ulid.isExpired(token, CONFIG.SYSTEM.EMAIL_TOKEN_EXPIRY);
    if (isTokenExpired) throw new UnauthorizedException('Invalid or expired verification token');

    const userAccount = await this.userAccountRepository.findUserByToken(token);

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const updatedUserAccount = await this.userAccountRepository.update(
      userAccount,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction },
    );
    if (!updatedUserAccount) throw new BadRequestException();

    if (!userAccount.twoFactorEnabled) {
      await audit.log(LogStatus.Denied);
      throw new UnauthorizedException('Two-factor authentication required');
    }

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

    await audit.log(LogStatus.Success);

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

    await this.logActivityRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserAccount,
        newValue: updatedUserAccount,
        oldValue: userAccount,
      },
      transaction,
    );

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

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

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

    await this.logActivityRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserAccount,
        newValue: updatedUserAccount,
        oldValue: userAccount,
      },
      transaction,
    );

    password = '';
    resetPasswordData.password = '';

    await audit.log(LogStatus.Success);
  }

  @Transactional()
  public async generateTwoFactorSecret(token: string, transaction?: Transaction): Promise<any> {
    if (!token) throw new UnauthorizedException();

    const userAccount = await this.userAccountRepository.findOne({
      where: {
        confirmToken: token,
      },
    });

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const result = await this.mfaService.generateSecret(userAccount, transaction);

    if (!result) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return result;
  }

  @Transactional()
  public async verifyTwoFactorSecret(
    data: any,
    user: any,
    transaction?: Transaction,
  ): Promise<any> {
    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const result = await this.mfaService.verifySecret(data, user, transaction);
    if (!result) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return result;
  }

  @Transactional()
  public async validateTwoFactorSecret(mfaData: any, transaction?: Transaction): Promise<any> {
    const { token, mfaToken } = mfaData || {};
    if (!token?.trim() || !mfaToken?.trim()) throw new UnauthorizedException();

    const userAccount = await this.userAccountRepository.findOne({
      where: {
        confirmToken: token,
      },
    });

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: userAccount.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const result = await this.mfaService.validateToken(mfaToken, userAccount, transaction);
    if (!result) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return result;
  }

  @Transactional()
  public async disableTwoFactorSecret(
    data: any,
    user: any,
    transaction?: Transaction,
  ): Promise<any> {
    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.UserLogin,
        resourceName: TableNames.UserLogin,
      },
      transaction,
    );

    const result = await this.mfaService.disableSecret(data, user, transaction);
    if (!result) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return result;
  }

  public async verifyToken(token: string): Promise<boolean> {
    const userAccount = await this.userAccountRepository.findUserByToken(token);

    if (!userAccount) throw new UnauthorizedException();

    return true;
  }

  private async passwordSignInAsync(
    user: UserAccount,
    password: string,
    transaction?: Transaction,
  ): Promise<SignInResult> {
    // if (!user.emailConfirmed && !user.phone_number_confirmed)
    if (!user.emailConfirmed)
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
      if (user.lockoutEnabled) {
        const accessFailedCount = (user.accessFailedCount || 0) + 1;
        const updates: Partial<UserAccount> = { accessFailedCount };

        if (accessFailedCount >= this.MAX_FAILED_ATTEMPTS) {
          const lockoutEnd = new Date();
          lockoutEnd.setMinutes(lockoutEnd.getMinutes() + this.DEFAULT_LOCKOUT_MINUTES);
          user.lockoutEnd = lockoutEnd;
        }

        const updatedUserAccount = await this.userAccountRepository.update(user, updates);

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
}
