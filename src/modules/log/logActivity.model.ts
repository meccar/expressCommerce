import { TableNames } from '@common/constants';
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  sql,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  Default,
  NotNull,
  PrimaryKey,
  Table,
} from '@sequelize/core/decorators-legacy';

@Table({
  tableName: TableNames.LogActivity,
})
export class LogActivity extends Model<
  InferAttributes<LogActivity>,
  InferCreationAttributes<LogActivity>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare userAccountCode: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare action: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare resourceName: string;

  @Attribute(DataTypes.UUID.V1)
  @NotNull
  @Default(sql.uuidV1)
  declare code: string;

  @Attribute(DataTypes.JSON)
  declare newValue: string;

  @Attribute(DataTypes.JSON)
  declare oldValue: string;

  @Attribute(DataTypes.DATE)
  declare createdAt: CreationOptional<Date>;
}
