import { BadRequestException } from '@common/exceptions';
import { ValidationError } from '@infrastructure/index';
import { Request, Response, NextFunction } from 'express';

export abstract class RequestValidator {
  abstract validate(data: any): Promise<{ isValid: boolean; errors?: ValidationError[] }>;

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const source = this.getValidationSource(req);
      if (!source) throw new BadRequestException('You have to provide data');

      const result = await this.validate(source);

      if (!result.isValid)
        throw new BadRequestException((result.errors ?? []).map(error => error.message).join(' ,'));

      next();
    };
  }

  protected getValidationSource(req: Request): any {
    return req.body;
  }
}
