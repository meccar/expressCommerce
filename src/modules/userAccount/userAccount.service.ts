import { mailService } from "@infrastructure/index";
import {
  BadRequestException,
  compare,
  encrypt,
  Transactional,
  UnauthorizedException,
} from "@common/index";
import { UserProfileRepository } from "@modules/userProfile";
import { Transaction } from "@sequelize/core";
import { UserAccountRepository } from "./userAccount.repository";
import { AuthenticationService } from "@modules/authentication/authentication.service";
import { CONFIG } from "@config/index";
import { UserTokenRepository } from "@modules/authentication/userToken.repository";

export class UserAccountService {
  private userProfileRepository: UserProfileRepository =
    new UserProfileRepository();
  private userAccountRepository: UserAccountRepository =
    new UserAccountRepository();
  private authenticationService: AuthenticationService =
    new AuthenticationService();
  private userTokenRepository: UserTokenRepository =
    new UserTokenRepository();

  constructor() {}

  @Transactional()
  public async register(
    userData: any,
    transaction?: Transaction
  ): Promise<any> {
    const { email, username, password } = userData;

    if (!((email && password) || (username && password )))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(
      email,
      username
    );

    if (existingUser)
      throw new BadRequestException("Email or username has existed");

    const hashedPassword = await encrypt(
      password,
      CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!,
      true
    );
        
    const userAccount = await this.userAccountRepository.create(
      {email,
      username,
      password: hashedPassword,
      isActive: true},
      {transaction}!
    );

    userAccount.password = "";
    userData.password = ""

    if (!userAccount) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.create(
      { userAccountCode: userAccount.code },
      { transaction }
  );

    await mailService.send(email, "Welcome to our platform!", "welcome", { username });

    return {
      user: userAccount.toJSON(),
      profile: userProfile.toJSON(),
    };
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

    const signInResult = await this.authenticationService.passwordSignInAsync(
      existingUser,
      password,
      { lockoutOnFailure, requireConfirmed }
    );

    if (!signInResult.succeeded)
      throw new UnauthorizedException(signInResult.message);

    await this.authenticationService.signInWithClaimsAsync(
      existingUser.code,
      existingUser.email,
      existingUser.email,
      "Local",
      transaction
    );

    return await this.authenticationService.generateToken(existingUser, {
      expiresIn: "1d",
      isPersistent,
      transaction,
    });
  }

  @Transactional()
  public async logout(logoutData: any, user: any, transaction?: Transaction): Promise<any> {
    const { refreshToken } = logoutData;

    if (!user) throw new UnauthorizedException();
    if (!refreshToken) throw new UnauthorizedException();

    await this.userTokenRepository.delete(
      { userAccountCode: user.code },
      { transaction }
    )
    
    return { message: "Logged out successfully" };
  }
}
