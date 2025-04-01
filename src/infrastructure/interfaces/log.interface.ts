import { BaseModel, LogStatus, TableNames } from '@common/index';
import { InferAttributes, InferCreationAttributes, Model, ModelStatic } from '@sequelize/core';

export type AnyModel = typeof BaseModel<InferAttributes<any>, InferCreationAttributes<any>>;
// type AnyModel = ModelStatic<Model>;

export interface InsertLogAuditOptions {
  userAccountCode: string;
  action: number;
  model: TableNames;
  resourceName: string;
  resourceField?: string;
  status: LogStatus;
}

export interface InsertLogActivityOptions {
  userAccountCode: string;
  action: number;
  model: TableNames;
  newValue?: any;
  oldValue?: any;
}
