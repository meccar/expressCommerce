import { BaseRoute } from '@common/utils';
import { UserProfileSerivce } from './userProfile.service';
import express, { Request, Response } from 'express';
import { Api, statusCodes } from '@common/constants';

export class UserProfileRoute extends BaseRoute {
  private readonly userProfileSerivce: UserProfileSerivce;

  constructor(router: express.Router) {
    super(router, Api.service.profile);
    this.userProfileSerivce = new UserProfileSerivce();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.publicRoute('patch', this.update, '/:profileCode');
  }

  private async update(req: Request, res: Response): Promise<void> {
    const { profileCode } = req.params;
    const profileData = req.body;
    const result = await this.userProfileSerivce.update(profileCode, profileData);
    res.success(result, statusCodes.OK);
  }
}
