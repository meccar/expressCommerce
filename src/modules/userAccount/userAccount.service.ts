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
import { AuthenticationRepository } from "@modules/authentication/authentication.repository";

export class UserAccountService {
  private userProfileRepository: UserProfileRepository =
    new UserProfileRepository();
  private userAccountRepository: UserAccountRepository =
    new UserAccountRepository();
  private authenticationRepository: AuthenticationRepository =
    new AuthenticationRepository();
  constructor() {}

  @Transactional()
  public async register(
    userData: any,
    transaction?: Transaction
  ): Promise<any> {
    const { email, username, password } = userData;

    if (!(email && username && password))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(
      email,
      username
    );

    if (existingUser)
      throw new BadRequestException("Email or username has existed");

    const userAccount = await this.userAccountRepository.createAsync(
      email,
      username,
      password,
      transaction!
    );

    if (!userAccount) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.createAsync(
      userAccount.code,
      transaction!
    );

    await mailService.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to our platform!",
      html: `<p>Hello ${username},</p><p>Thank you for registering with us.</p>`,
    });

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

    const authResult = await this.authenticationRepository.passwordSignInAsync(
      existingUser,
      password,
      { lockoutOnFailure, requireConfirmed }
    );

    if (!authResult.succeeded)
      throw new UnauthorizedException(authResult.message);

    await this.authenticationRepository.signInWithClaimsAsync(
      existingUser.code,
      existingUser.email,
      existingUser.email,
      "Local",
      transaction
    );

    return await this.authenticationRepository.generateToken(existingUser, {
      expiresIn: "1d",
      isPersistent,
      transaction,
    });
  }
}
