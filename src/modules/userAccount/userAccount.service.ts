import { IAuthenticatedUser, IUserClaim, IUserProvider, mailService } from '@infrastructure/index';
import {
  BadRequestException,
  encrypt,
  Roles,
  Transactional,
  UnauthorizedException,
} from '@common/index';
import { UserProfileRepository } from '@modules/userProfile';
import { Transaction } from '@sequelize/core';
import { UserAccountRepository } from './userAccount.repository';
import { CONFIG } from '@config/index';
import { factory, detectPrng } from 'ulid';
import { UserTokenRepository } from '@modules/tokens/userToken.repository';
import { TokenService } from '@modules/tokens/tokens.service';
import { UserClaimRepository } from '@modules/claims';
import { UserRoleRepository } from '@modules/authorization/userRole.repository';
import { RoleRepository } from '@modules/authorization';

export class UserAccountService {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private tokenService: TokenService = new TokenService();

  constructor() {}

  @Transactional()
  public async register(userData: any, transaction?: Transaction): Promise<any> {
    const { email, username, password } = userData;

    if (!((email && password) || (username && password)))
      throw new BadRequestException('Please enter email, username and password');

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(email, username);

    if (existingUser) throw new BadRequestException('Email or username has existed');

    const hashedPassword = await encrypt(
      password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true,
    );

    const userAccount = await this.userAccountRepository.create(
      { email, username, password: hashedPassword },
      { transaction }!,
    );

    userData.password = '';

    if (!userAccount) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.createProfileByUserAccountCode(
      userAccount.code,
      transaction,
    );

    const userRole = await this.userRoleRepository.findOneByUser(userAccount.code);

    await this.userRoleRepository.addRoleToUser(userAccount.code, userRole!.roleCode, transaction);

    await this.userClaimRepository.addClaim(
      userAccount.code,
      'EmailConfirmed',
      'false',
      transaction,
    );

    const verificationToken = await this.generateVerificationToken(userAccount.code, transaction);
    const verificationUrl = `${CONFIG.SYSTEM.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await mailService.send(email, 'Welcome to our platform!', 'email-verification', {
      username: username ?? email,
      verificationUrl,
    });

    return {
      user: userAccount.toJSON(),
      profile: userProfile.toJSON(),
    };
  }

  @Transactional()
  public async registerUser(userCode: string, email: string, roles: string[]) {}

  @Transactional()
  public async confirmEmail(
    token: string,
    transaction?: Transaction,
  ): Promise<{ claim: IUserClaim; provider: IUserProvider }> {
    const userEmailToken = await this.userTokenRepository.findOne({
      where: {
        loginProvider: 'email_verification',
        name: 'email_verification',
        value: token,
      },
    });

    if (!userEmailToken) throw new UnauthorizedException('Invalid or expired verification token');

    const userAccount = await this.userAccountRepository.findOne({
      where: { code: userEmailToken.userAccountCode },
    });

    if (!userAccount) throw new BadRequestException('User account not found');

    const [affectedCount, updatedUserAccount] = await this.userAccountRepository.update(
      userAccount.code,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction },
    );
    if (affectedCount === 0) throw new BadRequestException();

    await this.userTokenRepository.softDelete({ value: token }, { transaction });
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

    const newRoleClaim = await this.userClaimRepository.addClaim(
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

    const newUserToken = await this.userTokenRepository.addUserToken(
      userAccount.code,
      userProvider.provider,
      userProvider.name!,
      userProvider.providerKey,
      transaction,
    );

    const claim: IUserClaim = {
      type: newRoleClaim.claimType,
      value: newRoleClaim.claimValue,
    };

    const provider: IUserProvider = {
      provider: newUserToken.loginProvider,
      providerKey: newUserToken.value,
      name: newUserToken.name,
    };

    return { claim, provider };
  }

  private async generateVerificationToken(
    userAccountCode: string,
    transaction?: Transaction,
  ): Promise<string> {
    const ulid = factory(detectPrng(false));
    const tokenValue = ulid();
    await this.tokenService.storeToken(
      userAccountCode,
      'email_verification',
      'email_verification',
      tokenValue,
      transaction,
    );
    return tokenValue;
  }
}
