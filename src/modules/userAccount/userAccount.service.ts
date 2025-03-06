import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { mailService } from "@infrastructure/index";
import { BadRequestException, compare, encrypt, Transactional } from "@common/index";
import { UserProfile } from "@modules/userProfile";
import { Op, Transaction } from "@sequelize/core";
import { CONFIG } from "@config/index";
import { AuthenticationService } from "@modules/authentication/authentication.service";
import { UserAccountRepository } from "./userAccount.repository";

export class UserAccountService {
  constructor(
    private authenticationService: AuthenticationService,
    private userAccountRepository: UserAccountRepository,
  ) {
    this.authenticationService = authenticationService;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional()
  public async register(userData: any, transaction?: Transaction): Promise<any> {
    const { email, username, password } = userData;

    if (!(email && username && password))
      throw new BadRequestException(
        "Please enter email, username and password"
      );

    const existingUser = await this.userAccountRepository.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser)
      throw new BadRequestException("Email or username already in use");

    const hashedPassword = await encrypt(password, CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!, true);

    const userAccount = await this.userAccountRepository.create(
      {
        email,
        username,
        password: hashedPassword,
        isActive: true,
      },
      { transaction }
    );

    const userProfile = await UserProfile.create(
      {
        userAccountCode: userAccount.code,
      } as any,
      { transaction }
    );

    const { password: _, ...userWithoutPassword } = userAccount.toJSON();

    await mailService.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to our platform!",
      html: `<p>Hello ${username},</p><p>Thank you for registering with us.</p>`,
    });

    return {
      ...userWithoutPassword,
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

    const existingUser = await this.userAccountRepository.findByEmailOrUsername(email, username);

    if (!existingUser)
      throw new BadRequestException(
        "Email, username or password is not correct"
      );

    if (await !compare(password, existingUser.password, CONFIG.SYSTEM.ENCRYPT_SENSITIVE_SECRET_KEY!, true))
      throw new BadRequestException(
        "Email, username or password is not correct"
      );

    const token = await this.authenticationService.generateToken(username, {expiresIn: "1", transaction});
    
    await this.authenticationService.login(existingUser.code, email, email, "Local", transaction);
    
    return {
      token
    };
  }
}
