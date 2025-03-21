import { Api, statusCodes } from '@common/index';
import { UserAccountService } from './userAccount.service';
import express, { Request, Response } from 'express';
import { BaseRoute } from '@common/index';
import { validation } from '@gateway/middleware';

export class UserAccountRoute extends BaseRoute {
  private readonly userAccountService: UserAccountService;

  constructor(router: express.Router) {
    super(router, Api.service.userAccount);
    this.userAccountService = new UserAccountService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.publicRoute('post', Api.method.register, this.register);
    this.protectedRoute('post', Api.method.user, this.createAccount);
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

  private async createAccount(req: Request, res: Response): Promise<void> {
    const userData = req.body;
    const user = req.user;
    const result = await this.userAccountService.createAccount(userData, user);
    res.success(result, statusCodes.CREATED);
  }
}
