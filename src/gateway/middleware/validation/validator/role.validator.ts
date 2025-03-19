import { z } from 'zod';
import { HttpMethod } from '@common/index';
import { ModelCacheValidator } from './modelCacheValidator';

export class RoleValidator extends ModelCacheValidator {
  protected schema = z.object({
    name: z.string().min(1, 'Role name is required'),
    permissions: z.array(
      z.object({
        action: z.nativeEnum(HttpMethod, {
          errorMap: () => ({
            message: `Action must be one of: ${Object.values(HttpMethod).join(', ')}`,
          }),
        }),
        subject: z.string().refine(
          subject => this.isValidSubject(subject),
          subject => ({
            message: `Subject "${subject}" is not a valid model. Valid models: ${this.getAvailableModels().join(', ')}`,
          }),
        ),
        fields: z.array(z.string()).refine(
          fields => {
            if (fields.length === 1 && fields[0] === '*') return true;

            const subject = fields[0].toLowerCase();

            const validFields = this.getValidFieldsForSubject(subject);
            return fields.every(field => validFields.includes(field));
          },
          { message: 'Invalid fields for the given subject.' },
        ),
      }),
    ),
  });

  public async validate(data: any) {
    this.initializeModelCache();
    return super.validate(data);
  }
}
