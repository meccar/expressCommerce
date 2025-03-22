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
    this.publicRoute('post', this.login, Api.method.login);
    this.publicRoute('get', this.confirmEmail, Api.method.confirmEmail);
    this.publicRoute('post', this.resetPassword, Api.method.resetPassword);
    this.publicRoute('post', this.resetPasswordRequest, Api.method.requestResetPassword);
    this.publicRoute('get', this.verifyToken, Api.method.verifyToken);
    this.publicRoute('post', this.generateTwoFactorSecret, Api.method.generateTwoFactorSecret);
    this.publicRoute('post', this.validateTwoFactorSecret, Api.method.validateTwoFactorSecret);
    this.protectedRoute('post', this.logout, Api.method.logout);
    this.protectedRoute('post', this.refreshToken, Api.method.refreshToken);
    this.protectedRoute('post', this.verifyTwoFactorSecret, Api.method.verifyTwoFactorSecret);
    this.protectedRoute('post', this.disableTwoFactorSecret, Api.method.disableTwoFactorSecret);
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
    const token = req.query.token as string;
    const result = await this.authenticationService.confirmEmail(token);
    res.success(result, statusCodes.OK);
  }

  private async resetPasswordRequest(req: Request, res: Response): Promise<void> {
    const email = req.query.email as string;
    const result = await this.authenticationService.resetPasswordRequest(email);
    res.success(result, statusCodes.OK);
  }

  private async resetPassword(req: Request, res: Response): Promise<void> {
    const token = req.query.token as string;
    const resetPasswordData = req.body;
    const result = await this.authenticationService.resetPassword(resetPasswordData, token);
    res.success(result, statusCodes.OK);
  }

  private async verifyToken(req: Request, res: Response): Promise<void> {
    const token = req.query.token as string;
    const result = await this.authenticationService.verifyToken(token);
    res.success(result, statusCodes.OK);
  }

  private async generateTwoFactorSecret(req: Request, res: Response): Promise<void> {
    const token = req.query.token as string;
    const result = await this.authenticationService.generateTwoFactorSecret(token);
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
