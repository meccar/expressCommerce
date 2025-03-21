import { IUserClaim, IUserProvider, mailService } from '@infrastructure/index';
import {
  BadRequestException,
  encrypt,
  Roles,
  Transactional,
  Ulid,
  UnauthorizedException,
} from '@common/index';
import { UserProfileRepository } from '@modules/userProfile';
import { Transaction } from '@sequelize/core';
import { UserAccountRepository } from './userAccount.repository';
import { CONFIG } from '@config/index';
import { UserClaimRepository } from '@modules/claims';
import { UserRoleRepository } from '@modules/authorization/userRole.repository';
import { RoleRepository } from '@modules/authorization';
import speakeasy from 'speakeasy';
import { AuthorizationService } from '@modules/authorization/authorization.service';

export class UserAccountService {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleRepository: RoleRepository = new RoleRepository();
  private authorizationService: AuthorizationService = new AuthorizationService();
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
  public async createAccount(userData: any, user?: any, transaction?: Transaction): Promise<any> {
    const { email, username, role } = userData;
    let { password } = userData;

    if (user) {
      const roleName = await this.authorizationService.getRoleNameByUserCode(user.code);
      if (!roleName || roleName !== Roles.Admin) throw new UnauthorizedException();
    }

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
