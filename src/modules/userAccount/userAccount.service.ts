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
import { CONFIG } from "@config/index";
import { factory, detectPrng } from 'ulid'
import { UserTokenRepository } from "@modules/tokens/userToken.repository";
import { TokenService } from "@modules/tokens/tokens.service";

export class UserAccountService {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private userTokenRepository: UserTokenRepository = new UserTokenRepository();
  private tokenService: TokenService = new TokenService();

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
      password: hashedPassword},
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

  @Transactional()
  public async confirmEmail(
    token: string,
    transaction?: Transaction
  ): Promise<void> {
    const userToken = await this.userTokenRepository.findOne({
      where: {
        loginProvider: 'email_verification',
        name: 'email_verification',
        value: token
      }
    });

    if (!userToken) throw new UnauthorizedException("Invalid or expired verification token");
    
    
    const userAccount = await this.userAccountRepository.findOne({
      where: { code: userToken.userAccountCode }
    });

    if (!userAccount) throw new BadRequestException("User account not found");
    
    
    await this.userAccountRepository.update(
      userAccount.code,
      {
        isActive: true,
        emailConfirmed: true,
      },
      { transaction }
    );
  
    await this.userTokenRepository.delete(
      { value: token },
      { transaction }
    );
  }

  private async generateVerificationToken(userAccountCode: string, transaction?: Transaction): Promise<string> {
    const ulid = factory(detectPrng(false))
    const tokenValue = ulid()
    await this.tokenService.storeToken(userAccountCode, 'email_verification', 'email_verification', tokenValue, transaction);
    return tokenValue;
  }
}
