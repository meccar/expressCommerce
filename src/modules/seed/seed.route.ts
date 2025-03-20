import { BaseRoute } from '@common/utils';
import express, { Request, Response } from 'express';
import { SeedService } from './seed.service';
import { Api, Roles, statusCodes } from '@common/constants';
import { validation } from '@gateway/index';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { UserAccountService } from '@modules/userAccount';

export class SeedRoute extends BaseRoute {
  private readonly seedService: SeedService;
  private readonly authorizationService: AuthorizationService = new AuthorizationService();
  private readonly userAccountService: UserAccountService = new UserAccountService();

  constructor(router: express.Router) {
    super(router, Api.service.seed);
    this.seedService = new SeedService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.publicRoute('post', Api.method.role, this.createAdminRole, validation.post.role);
    this.publicRoute('post', Api.method.user, this.createAdminAccount, validation.post.register);
  }

  private async createAdminRole(req: Request, res: Response): Promise<void> {
    const roleData = req.body;
    roleData.name = Roles.Admin;
    const result = await this.authorizationService.createRole(roleData);
    res.success(result, statusCodes.CREATED);
  }

  private async createAdminAccount(req: Request, res: Response): Promise<void> {
    const userData = req.body;
    if (!userData.role) userData.role = Roles.Admin;
    const result = await this.userAccountService.createAccount(userData);
    res.success(result, statusCodes.CREATED);
  }
}
