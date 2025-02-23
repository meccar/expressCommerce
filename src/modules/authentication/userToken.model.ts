import { BaseModel } from "@common/models/base.model";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { Attribute, Table } from "@sequelize/core/decorators-legacy";

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
export class UserToken extends BaseModel<
  InferAttributes<UserToken>,
  InferCreationAttributes<UserToken>
> {
  @Attribute(DataTypes.INTEGER)
  declare userId: CreationOptional<number>;

  @Attribute(DataTypes.STRING(450))
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare value: string;
}
