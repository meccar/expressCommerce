import { z } from 'zod';
import { RequestValidator } from './requestValidator';

export class RegisterValidator extends RequestValidator {
  protected schema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    username: z.string(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  });
}
