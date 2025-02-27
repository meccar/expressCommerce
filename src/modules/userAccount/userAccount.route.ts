import { Api, statusCodes } from "@common/index";
import { UserAccountService } from "./userAccount.service";
import express, { Request, Response } from 'express';
import { BaseRoute } from "@common/index";

export class UserAccountRoute extends BaseRoute {
    private readonly userAccountService: UserAccountService;
    
    constructor(
        router: express.Router
    ) {
        super(router);
        this.userAccountService = new UserAccountService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(`${Api.service.userAccount}/${Api.method.register}`, this.errorHandler(this.register))
    }

    private async register(req: Request, res: Response): Promise<void> {
        const userData = req.body;
        const result = await this.userAccountService.register(userData);
        res.success(result, statusCodes.CREATED);
    }
}