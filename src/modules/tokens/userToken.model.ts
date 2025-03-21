import { BaseModel, baseTableOptions, TableNames } from '@common/index';
import { DataTypes, InferAttributes, InferCreationAttributes, Model } from '@sequelize/core';
import { AllowNull, Attribute, Table } from '@sequelize/core/decorators-legacy';

@Table({
tableName: TableNames.UserToken,
  // ...baseTableOptions,
})
export class UserToken extends BaseModel<
  InferAttributes<UserToken>,
  InferCreationAttributes<UserToken>
> {
  @AllowNull
  @Attribute(DataTypes.UUID.V1)
  declare userAccountCode: string;

  @Attribute(DataTypes.STRING)
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.STRING(450))
  declare value: string;
}
