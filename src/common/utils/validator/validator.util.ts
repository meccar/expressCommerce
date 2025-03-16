import { BadRequestException } from '@common/exceptions';
import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string | number;
  message: string;
}

export abstract class RequestValidator {
  abstract validate(data: any): Promise<{ isValid: boolean; errors?: ValidationError[] }>;

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const source = this.getValidationSource(req);
      const result = await this.validate(source);

      if (!result.isValid) throw new BadRequestException(result.errors?.join(', '));

      next();
    };
  }

  protected getValidationSource(req: Request): any {
    return req.body;
  }
}


