import { Transactional, UnauthorizedException } from '@common/index';
import { CONFIG } from '@config/index';
import { JwtAccessPayload, JwtRefreshPayload } from '@infrastructure/index';
import { UserToken } from '@modules/authentication';
import { UserLoginRepository } from '@modules/authentication/userLogin.repository';
import { UserClaimRepository } from '@modules/claims';
import { UserTokenRepository } from '@modules/tokens/userToken.repository';
import { UserAccount, UserAccountRepository } from '@modules/userAccount';
import { Transaction } from '@sequelize/core';
import { Secret } from 'jsonwebtoken';
import type { Algorithm, SignOptions } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';

export class TokenService {
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userLoginRepository: UserLoginRepository = new UserLoginRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();

  public getJwtSecret(type: 'access' | 'refresh'): Buffer {
    return Buffer.from(
      type === 'access' ? CONFIG.SYSTEM.JWT_ACCESS_SECRET : CONFIG.SYSTEM.JWT_REFRESH_SECRET,
      'utf8',
    );
  }

  @Transactional()
  public async storeRefreshToken(
    userAccountCode: string,
    token: string,
    transaction?: Transaction,
  ): Promise<UserToken> {
    return this.storeToken(userAccountCode, 'JWT', 'RefreshToken', token, transaction);
  }

  @Transactional()
  public async storeToken(
    userAccountCode: string,
    loginProvider: string = 'JWT',
    name: string,
    value: string,
    transaction?: Transaction,
  ): Promise<UserToken> {
    return this.userTokenRepository.create(
      {
        userAccountCode,
        loginProvider,
        name,
        value,
      },
      { transaction },
    );
  }

  @Transactional()
  public async invalidateToken(token: string, transaction?: Transaction): Promise<void> {
    await this.userTokenRepository.softDelete({ value: token }, { transaction });
  }

  @Transactional()
  public async revokeAllUserTokens(
    userAccountCode: string,
    transaction?: Transaction,
  ): Promise<void> {
    await this.userTokenRepository.softDelete({ userAccountCode }, { transaction });
  }

  @Transactional()
  public async refreshTokenPair(
    refreshToken: string,
    options: { transaction?: Transaction } = {},
  ): Promise<{ user: UserAccount; newTokens: { accessToken: string; refreshToken: string } }> {
    const decoded = this.verifyRefreshToken(refreshToken);

    const [storedToken, user] = await Promise.all([
      this.findToken(decoded.code, 'JWT', 'RefreshToken', refreshToken),
      this.userAccountRepository.findOne({
        where: { code: decoded.code },
      }),
    ]);

    if (!storedToken || !user) throw new UnauthorizedException();

    const newTokens = await this.generateTokenPair(user, {
      isPersistent: true,
      transaction: options.transaction,
    });

    await this.invalidateToken(refreshToken, options.transaction);

    await this.storeRefreshToken(user.code, newTokens.refreshToken, options.transaction);

    return { user, newTokens };
  }

  public async generateTokenPair(
    user: UserAccount,
    options: {
      expiresIn?: string;
      isPersistent?: boolean;
      transaction?: Transaction;
    } = {},
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [claimsResult, loginsResult] = await Promise.all([
      this.userClaimRepository.getUserClaims(user.code),
      this.userLoginRepository.findAll({
        where: { userAccountCode: user.code },
        transaction: options.transaction,
      }),
    ]);

    const claims = claimsResult || claimsResult;
    const logins = loginsResult || loginsResult;

    const accessPayload: JwtAccessPayload = {
      code: user.code,
      email: user.email || '',
      username: user.username || '',
      tokenType: 'access',
      claims: Array.isArray(claims)
        ? claims.map(claim => ({
            type: claim.claimType,
            value: claim.claimValue,
          }))
        : [],
      providers: Array.isArray(logins)
        ? logins.map(login => ({
            provider: String(login.loginProvider),
            providerKey: login.providerKey,
          }))
        : [],
      jti: crypto.randomUUID(),
    };

    const refreshPayload: JwtRefreshPayload = {
      code: user.code,
      email: user.email || '',
      username: user.username || '',
      tokenType: 'refresh',
      jti: crypto.randomUUID(),
    };

    const algorithm: Algorithm = 'HS256';

    const accessExpiresIn = options.isPersistent ? '30m' : options.expiresIn || '15m';
    const refreshExpiresIn = options.isPersistent ? '30d' : options.expiresIn || '1d';

    const accessToken = jwt.sign(
      accessPayload,
      this.getJwtSecret('access') as Secret,
      {
        algorithm,
        expiresIn: accessExpiresIn,
      } as SignOptions,
    );

    const refreshToken = jwt.sign(refreshPayload, this.getJwtSecret('refresh'), {
      algorithm,
      expiresIn: refreshExpiresIn,
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  public async findToken(
    userAccountCode: string,
    loginProvider: string = 'JWT',
    name: string,
    value: string,
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

  public verifyAccessToken(token: string): JwtAccessPayload {
    return jwt.verify(token, this.getJwtSecret('access')) as JwtAccessPayload;
  }

  public verifyRefreshToken(token: string): JwtRefreshPayload {
    return jwt.verify(token, this.getJwtSecret('refresh')) as JwtRefreshPayload;
  }
}
