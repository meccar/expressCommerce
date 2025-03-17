import { z } from 'zod';
import { RequestValidator } from './validator';
import { ValidationError } from '@infrastructure/index';

export class RegisterValidator extends RequestValidator {
  private loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    username: z.string(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  });

  async validate(data: any) {
    const errors: ValidationError[] = [];
    try {
      this.loginSchema.parse(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(e => {
          errors.push({ field: e.path[0], message: e.message });
        });
      }
      return { isValid: false, errors };
    }

    return { isValid: true };
  }
}
