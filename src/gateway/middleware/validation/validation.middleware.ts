import { RequestValidator } from '@common/index';
import { LoginValidator } from '@common/utils/validator/index';

export class ValidationMiddleware {
  public readonly post: Record<string, RequestValidator> = {
    login: new LoginValidator(),
  };
}

export const validation = new ValidationMiddleware();
