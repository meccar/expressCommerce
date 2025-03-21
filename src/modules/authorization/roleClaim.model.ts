import { BaseModel, TableNames } from '@common/index';
import { Permission } from '@infrastructure/index';
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
  tableName: TableNames.RoleClaim,
})
export class RoleClaim extends BaseModel<
  InferAttributes<RoleClaim>,
  InferCreationAttributes<RoleClaim>
> {
  @NotNull
  @Attribute(DataTypes.UUID.V1)
  declare roleCode: string;

  @Attribute(DataTypes.STRING)
  declare claimType: string;

  @Attribute(DataTypes.JSON)
  declare claimValue: Permission;
}
