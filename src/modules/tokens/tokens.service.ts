import { BadRequestException, Ulid, UnauthorizedException } from '@common/index';
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

  public async storeRefreshToken(
    userAccountCode: string,
    token: string,
    transaction?: Transaction,
  ): Promise<UserToken> {
    return this.storeToken(userAccountCode, 'JWT', 'JWT', token, transaction);
  }

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

  public async updateToken(
    userAccountCode: string,
    loginProvider: string = 'JWT',
    name: string,
    value: string,
    transaction?: Transaction,
  ): Promise<UserToken | null> {
    const userToken = await this.findToken(userAccountCode, loginProvider, name);

    if (!userToken) return null;

    return this.userTokenRepository.update(
      userToken,
      {
        value,
      },
      { transaction },
    );
  }

  public async revokeUserTokensByUserAccountCode(
    userAccountCode: string,
    transaction?: Transaction,
  ): Promise<number> {
    return await this.userTokenRepository.softDelete({ userAccountCode }, { transaction });
  }

  public async revokeUserTokensByToken(token: string, transaction?: Transaction): Promise<number> {
    return await this.userTokenRepository.softDelete({ value: token }, { transaction });
  }

  public async refreshToken(
    refreshToken: string,
    transaction?: Transaction,
  ): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    const decoded = this.verifyRefreshToken(refreshToken);

    const [storedToken, user] = await Promise.all([
      this.findToken(decoded.code, 'JWT', 'JWT'),
      this.userAccountRepository.findOne({
        where: { code: decoded.code },
      }),
    ]);

    if (!storedToken || storedToken.value !== decoded.tokenCode || !user)
      throw new UnauthorizedException();

    const tokenCode = Ulid.generateUlid();

    if (decoded.exp! - Math.floor(Date.now() / 1000) <= (decoded.persistent ? 1800 : 900)) {
      const updateToken = await this.updateToken(
        decoded.code,
        'JWT',
        'JWT',
        tokenCode,
        transaction,
      );

      if (!updateToken) throw new BadRequestException();

      const result = await this.generateTokenPair(user, tokenCode, {
        isPersistent: decoded.persistent,
      });
      const { accessToken, refreshToken } = result;

      return { user, accessToken, refreshToken };
    }

    const accessToken = await this.generateAccessToken(user, decoded.tokenCode, {
      isPersistent: decoded.persistent,
    });

    return { user, accessToken, refreshToken };
  }

  public async generateAccessToken(
    user: UserAccount,
    tokenCode: string,
    options: {
      expiresIn?: string;
      isPersistent?: boolean;
    } = {},
  ): Promise<string> {
    const [claimsResult, loginsResult] = await Promise.all([
      this.userClaimRepository.getUserClaims(user.code),
      this.userLoginRepository.findAll({
        where: { userAccountCode: user.code },
      }),
    ]);

    const accessPayload: JwtAccessPayload = {
      code: user.code,
      username: user.username || '',
      tokenType: 'access',
      tokenCode,
      persistent: options.isPersistent || false,
      claims: Array.isArray(claimsResult)
        ? claimsResult.map(claim => ({
            type: claim.claimType,
            value: claim.claimValue,
          }))
        : [],
      providers: Array.isArray(loginsResult)
        ? loginsResult.map(login => ({
            provider: String(login.loginProvider),
            providerKey: login.providerKey,
          }))
        : [],
    };

    const algorithm: Algorithm = 'HS256';
    const accessExpiresIn = options.isPersistent ? '30m' : options.expiresIn || '15m';

    return jwt.sign(
      accessPayload,
      this.getJwtSecret('access') as Secret,
      {
        algorithm,
        expiresIn: accessExpiresIn,
      } as SignOptions,
    );
  }

  public async generateTokenPair(
    user: UserAccount,
    tokenCode: string,
    options: {
      expiresIn?: string;
      isPersistent?: boolean;
    } = {},
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshPayload: JwtRefreshPayload = {
      code: user.code,
      username: user.username || '',
      tokenType: 'refresh',
      tokenCode,
      persistent: options.isPersistent || false,
    };

    const algorithm: Algorithm = 'HS256';
    const refreshExpiresIn = options.isPersistent ? '30d' : options.expiresIn || '1d';

    const accessToken = await this.generateAccessToken(user, tokenCode, options);
    const refreshToken = jwt.sign(
      refreshPayload,
      this.getJwtSecret('refresh') as Secret,
      {
        algorithm,
        expiresIn: refreshExpiresIn,
      } as SignOptions,
    );

    return { accessToken, refreshToken };
  }

  public async findToken(
    userAccountCode: string,
    loginProvider: string = 'JWT',
    name: string,
  ): Promise<UserToken | null> {
    return this.userTokenRepository.findOne({
      where: {
        userAccountCode,
        loginProvider,
        name,
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
