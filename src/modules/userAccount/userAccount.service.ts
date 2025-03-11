import { mailService } from "@infrastructure/index";
import {
  BadRequestException,
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
import { factory, detectPrng } from 'ulid'

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
  
  const verificationToken = await this.generateVerificationToken(userAccount.code, transaction);
  const verificationUrl = `${CONFIG.SYSTEM.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  await mailService.send(email, "Welcome to our platform!", "email-verification", { username: username ?? email, verificationUrl  });

    return {
      user: userAccount.toJSON(),
      profile: userProfile.toJSON(),
    };
  }

  private async generateVerificationToken(userAccountCode: string, transaction?: Transaction): Promise<string> {
    const ulid = factory(detectPrng(false))
    const tokenValue = ulid()
    
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24);
    
    const token = await this.userTokenRepository.create({
      userAccountCode,
      loginProvider: 'email_verification',
      name: 'email_verification',
      value: tokenValue
    }, { transaction });
    
    return tokenValue;
  }
}
