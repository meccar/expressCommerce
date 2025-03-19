import { BadRequestException } from '@common/exceptions';
import { ValidationError } from '@infrastructure/index';
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export abstract class RequestValidator<T = any> {
  protected abstract schema: ZodSchema<T>;

  public async validate(data: any): Promise<{ isValid: boolean; errors?: ValidationError[] }> {
    try {
      this.schema.parse(data);
      return { isValid: true };
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return { isValid: false, errors };
      }
      return {
        isValid: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

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
