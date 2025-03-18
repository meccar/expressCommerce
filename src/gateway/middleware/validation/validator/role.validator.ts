import { z } from 'zod';
import { RequestValidator } from './validator';
import { databaseService, ValidationError } from '@infrastructure/index';
import { HttpMethod } from '@common/index';

export class RoleValidator extends RequestValidator {
  private modelCache: Record<string, any> = {};

  private isValidSubject(subject: string): boolean {
    return subject.toLowerCase() in this.modelCache;
  }

  private getValidFieldsForSubject(subject: string): string[] {
    const model = this.modelCache[subject.toLowerCase()];
    if (!model) return [];

    const attributes = Object.keys(model.getAttributes());
    return attributes;
  }

  private roleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
    permission: z.object({
      action: z.nativeEnum(HttpMethod, {
        errorMap: () => ({
          message: `Action must be one of: ${Object.values(HttpMethod).join(', ')}`,
        }),
      }),
      subject: z.string().refine(
        subject => this.isValidSubject(subject),
        subject => ({
          message: `Subject "${subject}" is not a valid model. Valid models: ${Object.keys(this.modelCache).join(', ')}`,
        }),
      ),
      fields: z.array(z.string()).refine(
        fields => {
          const subject = fields.length > 0 ? this.modelCache[fields[0].toLowerCase()] : undefined;
          if (!subject) return false;
          const validFields = this.getValidFieldsForSubject(fields[0]);
          return fields.every(field => validFields.includes(field));
        },
        { message: 'Invalid fields for the given subject.' },
      ),
    }),
  });

  constructor() {
    super();
    this.initializeModelCache();
  }

  private initializeModelCache() {
    const models = databaseService.sequelize.models;

    Object.entries(models).forEach(([name, model]) => {
      this.modelCache[name.toLowerCase()] = model;
    });
  }

  public async validate(data: any) {
    const errors: ValidationError[] = [];
    try {
      this.roleSchema.parse(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(e => {
          errors.push({ field: e.path.join('.'), message: e.message });
        });
      }
      return { isValid: false, errors };
    }

    return { isValid: true };
  }
}
