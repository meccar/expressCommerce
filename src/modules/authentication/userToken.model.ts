import { BaseModel } from "@common/index";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserToken",
  underscored: true,
  indexes: [
    {
      name: "idx_usertoken_loginprovider",
      fields: ["login_provider"],
    },
  ],
})
export class UserToken extends Model<
  InferAttributes<UserToken>,
  InferCreationAttributes<UserToken>
> {
  @Attribute(DataTypes.STRING(20))
  @PrimaryKey
  declare userCode: string;

  @Attribute(DataTypes.STRING(450))
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare value: string;
}
