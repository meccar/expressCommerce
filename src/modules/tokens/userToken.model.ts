import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserToken",
  underscored: true,
})
export class UserToken extends Model<
  InferAttributes<UserToken>,
  InferCreationAttributes<UserToken>
> {
  @Attribute(DataTypes.UUID.V1)
  @PrimaryKey
  declare userAccountCode: string;

  @Attribute(DataTypes.STRING(450))
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare value: string;
}
