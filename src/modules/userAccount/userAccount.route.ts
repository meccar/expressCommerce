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
    this.publicRoute('post', Api.method.register, this.register);
    this.publicRoute('post', Api.method.login, this.login);
    this.protectedRoute('post', Api.method.logout, this.logout);
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

  /**
   * @swagger
   * /user/login:
   *   post:
   *     summary: login users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: login user
   */
  private async login(req: Request, res: Response): Promise<void> {
    const loginData = req.body;
    const result = await this.userAccountService.login(loginData);
    res.success(result, statusCodes.OK);
  }

  /**
   * @swagger
   * /user/logout:
   *   post:
   *     summary: logout users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: logout user
   */
  private async logout(req: Request, res: Response): Promise<void> {
    const logoutData = req.body;
    const user = req.user;
    const result = await this.userAccountService.logout(logoutData, user);
    res.success(result, statusCodes.OK);
  }
}
