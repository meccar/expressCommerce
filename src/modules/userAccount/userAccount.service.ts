import { IUserClaim, IUserProvider, mailService } from '@infrastructure/index';
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
import { UserTokenRepository } from '@modules/tokens/userToken.repository';
import { UserClaimRepository } from '@modules/claims';
import { UserRoleRepository } from '@modules/authorization/userRole.repository';
import { RoleRepository } from '@modules/authorization';
import speakeasy from 'speakeasy';

export class UserAccountService {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleRepository: RoleRepository = new RoleRepository();

  constructor() {}

  @Transactional()
  public async register(userData: any, transaction?: Transaction): Promise<any> {
    const { email, username } = userData;
    let { password } = userData;

    if (!(email && password && username && password))
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

    password = '';
    userData.password = '';

    if (!userAccount) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.createProfileByUserAccountCode(
      userAccount.code,
      transaction,
    );

    const role = await this.roleRepository.findByName(Roles.User);
    if (!role) throw new BadRequestException();

    await this.userRoleRepository.addRoleToUser(userAccount.code, role.code, transaction);

    await this.userClaimRepository.addClaim(
      userAccount.code,
      'EmailConfirmed',
      'false',
      transaction,
    );

    const verificationUrl = `${CONFIG.SYSTEM.FRONTEND_URL}/verify-email?token=${userAccount.confirmToken}`;

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
    const userAccount = await this.userAccountRepository.findOne({
      where: {
        confirmToken: token,
      },
    });

    if (!userAccount) throw new UnauthorizedException('Invalid or expired verification token');

    const [affectedRows] = await this.userAccountRepository.update(
      userAccount.code,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction },
    );
    if (affectedRows === 0) throw new BadRequestException();

    if (!userAccount.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication required');

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

  @Transactional()
  public async createAccount(userData: any, transaction?: Transaction): Promise<any> {
    const { email, username, role } = userData;
    let { password } = userData;

    if (!(email && password && username && password))
      throw new BadRequestException('Please enter email, username and password');

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(email, username);

    if (existingUser) throw new BadRequestException('Email or username has existed');

    const hashedPassword = await encrypt(
      password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true,
    );

    const secret = speakeasy.generateSecret({
      name: `${CONFIG.SYSTEM.APP_NAME}:${email}`,
      length: 20,
    });

    const userAccount = await this.userAccountRepository.create(
      {
        email,
        username,
        password: hashedPassword,
        isTwoFactorVerified: true,
        emailConfirmed: true,
        phoneNumberConfirmed: true,
        twoFactorEnabled: true,
        twoFactorSecret: secret.base32,
        isActive: true,
      },
      { transaction }!,
    );

    password = '';
    userData.password = '';

    if (!userAccount) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.createProfileByUserAccountCode(
      userAccount.code,
      transaction,
    );

    const newRole = await this.roleRepository.findOrCreate({
      where: { name: role },
      transaction,
    });
    if (!newRole) throw new BadRequestException();

    await this.userRoleRepository.addRoleToUser(userAccount.code, newRole.code, transaction);

    await this.userClaimRepository.addClaim(
      userAccount.code,
      'EmailConfirmed',
      'true',
      transaction,
    );

    return {
      user: userAccount.toJSON(),
      profile: userProfile.toJSON(),
    };
  }
}
