import { BaseRoute } from '@common/utils';
import { AuthenticationService } from './authentication.service';
import express, { Request, Response } from 'express';
import { Api, statusCodes } from '@common/index';
import { validation } from '@gateway/middleware';

export class AuthenticationRoute extends BaseRoute {
  private readonly authenticationService: AuthenticationService;

  constructor(router: express.Router) {
    super(router, Api.service.auth);
    this.authenticationService = new AuthenticationService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.publicRoute('post', Api.method.login, this.login);
    this.publicRoute('get', Api.method.confirmEmail, this.confirmEmail);
    this.publicRoute('post', Api.method.generateTwoFactorSecret, this.generateTwoFactorSecret);
    this.publicRoute('post', Api.method.validateTwoFactorSecret, this.validateTwoFactorSecret);
    this.protectedRoute('post', Api.method.logout, this.logout);
    this.protectedRoute('post', Api.method.refreshToken, this.refreshToken);
    this.protectedRoute('post', Api.method.verifyTwoFactorSecret, this.verifyTwoFactorSecret);
    this.protectedRoute('post', Api.method.disableTwoFactorSecret, this.disableTwoFactorSecret);
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: login users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: login user
   */
  private async login(req: Request, res: Response): Promise<void> {
    const loginData = req.body;
    const result = await this.authenticationService.login(loginData);
    res.success(result, statusCodes.OK);
  }

  /**
   * @swagger
   * /auth/logout:
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
    const result = await this.authenticationService.logout(logoutData, user);
    res.success(result, statusCodes.OK);
  }

  /**
   * @swagger
   * /auth/refreshToken:
   *   post:
   *     summary: refreshToken users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: refreshToken user
   */
  private async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshTokenData = req.body;
    const result = await this.authenticationService.refreshToken(refreshTokenData);
    res.success(result, statusCodes.OK);
  }

  private async confirmEmail(req: Request, res: Response): Promise<void> {
    const confirmEmailData = req.query;
    const result = await this.authenticationService.confirmEmail(confirmEmailData);
    res.success(result, statusCodes.OK);
  }

  private async generateTwoFactorSecret(req: Request, res: Response): Promise<void> {
    const mfaData = req.query;
    const result = await this.authenticationService.generateTwoFactorSecret(mfaData);
    res.success(result, statusCodes.CREATED);
  }

  private async verifyTwoFactorSecret(req: Request, res: Response): Promise<void> {
    const twoFactorSecretData = req.body;
    const user = req.user;
    const result = await this.authenticationService.verifyTwoFactorSecret(
      twoFactorSecretData,
      user,
    );
    res.success(result, statusCodes.OK);
  }

  private async validateTwoFactorSecret(req: Request, res: Response): Promise<void> {
    const mfaData = { ...req.query, ...req.body };
    const result = await this.authenticationService.validateTwoFactorSecret(mfaData);
    res.success(result, statusCodes.OK);
  }

  private async disableTwoFactorSecret(req: Request, res: Response): Promise<void> {
    const twoFactorSecretData = req.body;
    const user = req.user;
    const result = await this.authenticationService.disableTwoFactorSecret(
      twoFactorSecretData,
      user,
    );
    res.success(result, statusCodes.OK);
  }
}
