import { BaseRoute } from '@common/utils';
import express, { Request, Response } from 'express';
import { SeedService } from './seed.service';
import { Api, statusCodes } from '@common/constants';

export class SeedRoute extends BaseRoute {
  private readonly seedService: SeedService;

  constructor(router: express.Router) {
    super(router, Api.service.seed);
    this.seedService = new SeedService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.publicRoute('post', Api.method.role, this.createRole);
  }

  private async createRole(req: Request, res: Response): Promise<void> {
    const roleData = req.body;
    const result = await this.seedService.seedRole(roleData);
    res.success(result, statusCodes.CREATED);
  }
}
