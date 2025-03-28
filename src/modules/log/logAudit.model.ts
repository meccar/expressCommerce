import { TableNames } from '@common/constants';
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
  tableName: TableNames.LogAudit,
})
export class LogAudit extends Model<InferAttributes<LogAudit>, InferCreationAttributes<LogAudit>> {
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

  @Attribute(DataTypes.STRING)
  declare resourceField: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare code: string;

  @Attribute(DataTypes.INTEGER)
  declare status: number;

  @Attribute(DataTypes.DATE)
  declare createdAt: CreationOptional<Date>;
}
