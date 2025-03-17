import { RegisterValidator } from './validator/register.validator';

export class ValidationMiddleware {
  public readonly post = {
    register: new RegisterValidator(),
  } as const;
}

export const validation = new ValidationMiddleware();
