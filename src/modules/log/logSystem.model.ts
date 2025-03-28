import { TableNames } from '@common/constants';
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  NotNull,
  PrimaryKey,
  Table,
} from '@sequelize/core/decorators-legacy';

@Table({
  tableName: TableNames.LogSystem,
})
export class LogSystem extends Model<
  InferAttributes<LogSystem>,
  InferCreationAttributes<LogSystem>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare serviceName: string;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare eventType: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare message: string;

  @Attribute(DataTypes.JSON)
  declare details: string;

  @Attribute(DataTypes.STRING)
  declare serverIp: string;

  @Attribute(DataTypes.STRING)
  declare environment: string;

  @Attribute(DataTypes.DATE)
  declare createdAt: CreationOptional<Date>;
}
