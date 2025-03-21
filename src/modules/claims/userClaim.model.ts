import { BaseModel, TableNames } from '@common/index';
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  NotNull,
  PrimaryKey,
  Table,
} from '@sequelize/core/decorators-legacy';

@Table({
  tableName: TableNames.UserClaim,
})
export class UserClaim extends BaseModel<
  InferAttributes<UserClaim>,
  InferCreationAttributes<UserClaim>
> {
  @NotNull
  @Attribute(DataTypes.UUID.V1)
  declare userAccountCode: string;

  @Attribute(DataTypes.STRING)
  declare claimType: string;

  @Attribute(DataTypes.STRING)
  declare claimValue: string;
}
