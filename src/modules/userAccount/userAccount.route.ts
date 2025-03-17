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
    this.publicRoute('post', Api.method.register, this.register, validation.post.register);
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
}
