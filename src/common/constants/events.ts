import EventEmitter from 'events';

export const repositoryEventBus = new EventEmitter();

export const RepositoryEvent = {
  CREATED: 'entity:created',
  UPDATED: 'entity:updated',
  DELETED: 'entity:deleted',
  RESTORED: 'entity:restored',
} as const;

export type RepositoryEvent = (typeof RepositoryEvent)[keyof typeof RepositoryEvent];
