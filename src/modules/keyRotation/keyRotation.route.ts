import { Api, BaseRoute, statusCodes } from "@common/index";
import { EncryptableModelStatic, keyRotationService } from "@infrastructure/keyRotation/keyRotation.service";
import { UserAccount } from "@modules/userAccount";
import express, { Request, Response } from "express";

export class KeyRotationRoute extends BaseRoute {
    constructor(router: express.Router) {
        super(router, `${Api.service.admin}`);
        this.initializeRoutes();
      }

      private initializeRoutes(): void {
        this.router.post(`${this.basePath}/rotate-keys`, this.errorHandler(this.rotateKeys));
      }

      private async rotateKeys(req: Request, res: Response): Promise<void> {
          const modelFieldMap = [
            {
                model: UserAccount as unknown as EncryptableModelStatic,
                fields: ['password']
            },

          ];
          
          const options = {
            batchSize: req.body.batchSize || 100,
            noIV: req.body.noIV || false
          };
          
          await keyRotationService.rotateKeys(modelFieldMap, options);
          
          res.success("success" ,statusCodes.OK);
      }
    
}
