import { Api, statusCodes } from "@common/index";
import { UserAccountService } from "./userAccount.service";
import express, { Request, Response } from "express";
import { BaseRoute } from "@common/index";

export class UserAccountRoute extends BaseRoute {
  private readonly userAccountService: UserAccountService;

  constructor(router: express.Router) {
    super(router, `${Api.service.userAccount}`);
    this.userAccountService = new UserAccountService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.basePath}${Api.method.register}`,
      this.errorHandler(this.register)
    );
    this.router.post(
      `${this.basePath}${Api.method.login}`,
      this.errorHandler(this.login)
    );
  }

  /**
   * @swagger
   * /user/register:
   *   post:
   *     summary: register users
   *     tags: [Users]
   *     responses:
   *       201:
   *         description: register user
   */
  private async register(req: Request, res: Response): Promise<void> {
    const userData = req.body;
    const result = await this.userAccountService.register(userData);
    res.success(result, statusCodes.CREATED);
  }

  private async login(req: Request, res: Response): Promise<void> {
    const loginData = req.body;
    const result = await this.userAccountService.login(loginData);
    res.success(result, statusCodes.OK);
  }
}
