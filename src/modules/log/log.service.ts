import { LogAction } from '@modules/userProfile';
import { ModelStatic, Model, Transaction } from '@sequelize/core';
import { LogActivityRepository } from './logActivity.repository';
import { LogAuditRepository } from './logAudit.repository';
import { RepositoryEvent, repositoryEventBus } from '@common/index';

export interface LogOptions {
  userAccountCode: string;
  useActivityLog?: boolean;
  useAuditLog?: boolean;
  status?: number;
  resourceName?: string;
  resourceField?: string;
}

export class LoggingService {
  constructor(
    private readonly logActivityRepository?: LogActivityRepository,
    private readonly logAuditRepository?: LogAuditRepository,
  ) {
    this.initEventListeners();
  }

  private initEventListeners(): void {
    repositoryEventBus.on(RepositoryEvent.CREATED, this.handleCreatedEvent.bind(this));
    repositoryEventBus.on(RepositoryEvent.UPDATED, this.handleUpdatedEvent.bind(this));
    repositoryEventBus.on(RepositoryEvent.DELETED, this.handleDeletedEvent.bind(this));
    repositoryEventBus.on(RepositoryEvent.RESTORED, this.handleRestoredEvent.bind(this));
  }

  private async logAction(
    model: ModelStatic<Model>,
    action: number,
    code: string | undefined,
    oldValue?: any,
    newValue?: any,
    options?: {
      transaction?: Transaction;
      logOptions?: LogOptions;
    },
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (!code || !options?.logOptions?.userAccountCode) return;

    if (options?.logOptions?.useActivityLog && this.logActivityRepository)
      promises.push(
        this.logActivityRepository.addLog(
          {
            userAccountCode: options.logOptions.userAccountCode,
            action,
            model,
            code,
            oldValue,
            newValue,
          },
          options.transaction,
        ),
      );

    if (options?.logOptions?.useAuditLog && this.logAuditRepository)
      promises.push(
        this.logAuditRepository.addLog(
          {
            userAccountCode: options.logOptions.userAccountCode,
            action,
            model,
            resourceName: options.logOptions.resourceName || model.name,
            resourceField: options.logOptions.resourceField,
            status: options.logOptions.status || 1,
            code,
          },
          options.transaction,
        ),
      );

    if (promises.length > 0) await Promise.all(promises);
  }

  private async handleCreatedEvent(event: any): Promise<void> {
    const { model, instance, data, options } = event;

    if (options?.logOptions)
      await this.logAction(model, LogAction.Create, instance.code, null, data, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });
  }

  private async handleUpdatedEvent(event: any): Promise<void> {
    const { model, oldInstance, newInstance, data, options } = event;

    if (options?.logOptions)
      await this.logAction(model, LogAction.Update, newInstance.code, oldInstance.toJSON(), data, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });
  }

  private async handleDeletedEvent(event: any): Promise<void> {
    const { model, instance, options } = event;

    if (options?.logOptions)
      await this.logAction(model, LogAction.Delete, instance.code, instance.toJSON(), null, {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });
  }

  private async handleRestoredEvent(event: any): Promise<void> {
    const { model, instance, options } = event;

    if (options?.logOptions)
      await this.logAction(model, LogAction.Restore, instance.code, null, instance.toJSON(), {
        transaction: options.transaction,
        logOptions: options.logOptions,
      });
  }
}
