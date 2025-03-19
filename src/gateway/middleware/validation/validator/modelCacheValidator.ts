import { databaseService } from '@infrastructure/index';
import { RequestValidator } from './requestValidator';

export abstract class ModelCacheValidator<T = any> extends RequestValidator<T> {
  private modelCache: Record<string, any> = {};
  private modelCacheInitialized = false;

  protected initializeModelCache(): void {
    if (this.modelCacheInitialized) return;

    if (!databaseService.isConfigured()) {
      return;
    }

    const models = databaseService.sequelize.models;

    if (models && typeof models[Symbol.iterator] === 'function') {
      for (const model of models) {
        const modelName = model.name || model.constructor.name;
        this.modelCache[modelName.toLowerCase()] = model;
      }
    }

    this.modelCacheInitialized = true;
  }

  protected isValidSubject(subject: string): boolean {
    this.initializeModelCache();
    return subject.toLowerCase() in this.modelCache;
  }

  protected getValidFieldsForSubject(subject: string): string[] {
    this.initializeModelCache();
    const model = this.modelCache[subject.toLowerCase()];
    if (!model) return [];

    return Object.keys(model.getAttributes());
  }

  protected getAvailableModels(): string[] {
    this.initializeModelCache();
    return Object.keys(this.modelCache);
  }
}
