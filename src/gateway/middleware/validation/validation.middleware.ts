import { RegisterValidator } from './validator/register.validator';
import { RoleValidator } from './validator/role.validator';

export class ValidationMiddleware {
  public readonly post = {
    register: new RegisterValidator(),
    role: new RoleValidator(),
  } as const;
}

export const validation = new ValidationMiddleware();
