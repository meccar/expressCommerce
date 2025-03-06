import { mailService } from "@infrastructure/index";
import { BadRequestException, compare, encrypt, Transactional } from "@common/index";
import { UserProfileRepository } from "@modules/userProfile";
import { Transaction } from "@sequelize/core";
import { UserAccountRepository } from "./userAccount.repository";

export class UserAccountService {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  constructor() {}

  @Transactional()
  public async register(userData: any, transaction?: Transaction): Promise<any> {
    const { email, username, password } = userData;

    if (!(email && username && password))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const userAccount = await this.userAccountRepository.createAsync(email, username, password, transaction!)
    if (!userAccount)
      throw new BadRequestException();

    const userProfile = await this.userProfileRepository.createAsync(userAccount.code, transaction!);

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
    const { email, username, password } = loginData;

    if (!((email || username) && password))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const token = await this.userAccountRepository.validateUserAsync(email, username, password, transaction!)
    if (!token)
      throw new BadRequestException()

    return {
      token
    };
  }
}
