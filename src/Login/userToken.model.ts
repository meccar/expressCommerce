import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy";

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
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare userId: CreationOptional<number>;

  @NotNull
  @Attribute(DataTypes.STRING(450))
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare value: string;
}
