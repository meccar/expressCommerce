import { BaseModel } from '@common/index';
import { InferAttributes, InferCreationAttributes } from '@sequelize/core';

export type AnyModel = typeof BaseModel<InferAttributes<any>, InferCreationAttributes<any>>;

export interface InsertLogAuditOptions {
  userAccountCode: string;
  action: number;
  model: AnyModel;
  resourceName: string;
  resourceField?: string;
  status: number;
  code: string;
}

export interface InsertLogActivityOptions {
  userAccountCode: string;
  action: number;
  model: AnyModel;
  code: string;
  newValue?: any;
  oldValue?: any;
}
