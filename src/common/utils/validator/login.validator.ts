import { z } from 'zod';
import { RequestValidator, ValidationError } from './validator.util';

export class LoginValidator extends RequestValidator {
  private loginSchema = z
    .object({
      email: z.string().email({ message: 'Invalid email format' }).optional(),
      username: z.string().optional().nullable(),
      password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    })
    .refine(
      data => {
        const hasEmail = data.email && data.email.trim() !== '';
        const hasUsername = data.username && data.username.trim() !== '';

        if (hasEmail && hasUsername) {
          return false;
        }

        if (!hasEmail && !hasUsername) {
          return false;
        }

        return true;
      },
      {
        message: 'Either email or username must be provided, but not both.',
        path: ['email', 'username'],
      },
    );

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
