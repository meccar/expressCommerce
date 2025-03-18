import { BaseRoute } from '@common/utils';
import { AuthorizationService } from './authorization.service';
import express, { Request, Response } from 'express';
import { Api, statusCodes } from '@common/constants';
import { validation } from '@gateway/middleware';

export class AuthorizationRoute extends BaseRoute {
  private readonly authorizationService = new AuthorizationService();

  constructor(router: express.Router) {
    super(router, Api.service.auth);
    this.authorizationService = new AuthorizationService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRoute('post', Api.method.role, this.createRole, validation.post.role);
    this.protectedRoute('get', `${Api.method.role}/:roleCode`, this.getDetailRole);
    this.protectedRoute('get', Api.method.role, this.getAllRoles);
    this.protectedRoute('delete', `${Api.method.role}/:roleCode`, this.deleteRole);
    this.protectedRoute('put', `${Api.method.role}/:roleCode`, this.updateRole);
  }

  /**
   * @swagger
   * /auth/role:
   *   post:
   *     summary: Create a new role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Role created successfully
   */
  private async createRole(req: Request, res: Response): Promise<void> {
    const roleData = req.body;
    const result = await this.authorizationService.createRole(roleData);
    res.success(result, statusCodes.CREATED);
  }

  /**
   * @swagger
   * /auth/role/{roleCode}:
   *   get:
   *     summary: Get a role by code
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleCode
   *         required: true
   *         schema:
   *           type: string
   *         description: The role code
   *     responses:
   *       200:
   *         description: Role details
   */
  private async getDetailRole(req: Request, res: Response): Promise<void> {
    const { roleCode } = req.params;
    // const { roleCode } = req.query;
    const result = await this.authorizationService.getDetailRole(roleCode);
    res.success(result, statusCodes.OK);
  }

  /**
   * @swagger
   * /auth/role:
   *   get:
   *     summary: Get all roles
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all roles
   */
  private async getAllRoles(req: Request, res: Response): Promise<void> {
    const result = await this.authorizationService.getAllRoles();
    res.success(result, statusCodes.OK);
  }

  /**
   * @swagger
   * /auth/role/{roleCode}:
   *   delete:
   *     summary: Delete a role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleCode
   *         required: true
   *         schema:
   *           type: string
   *         description: The role code
   *     responses:
   *       200:
   *         description: Role deleted successfully
   */
  private async deleteRole(req: Request, res: Response): Promise<void> {
    const { roleCode } = req.params;
    // const { roleCode } = req.query;
    const result = await this.authorizationService.deleteRole(roleCode);

    res.success(
      {
        message: 'Role deleted successfully',
        affectedRows: result,
      },
      statusCodes.OK,
    );
  }

  /**
   * @swagger
   * /auth/role/{roleCode}:
   *   put:
   *     summary: Update a role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleCode
   *         required: true
   *         schema:
   *           type: string
   *         description: The role code
   *     responses:
   *       200:
   *         description: Role updated successfully
   */
  private async updateRole(req: Request, res: Response): Promise<void> {
    const { roleCode } = req.params;
    // const { roleCode } = req.query;
    const roleData = req.body;
    const result = await this.authorizationService.updateRole(roleCode, roleData);
    res.success(result, statusCodes.OK);
  }
}
