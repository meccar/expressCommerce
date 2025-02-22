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
  Index,
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserLogin",
  underscored: true,
  indexes: [
    {
      name: "idx_userlogin_userid",
      fields: ["user_id"],
    },
  ],
})
export class UserLogin extends Model<
  InferAttributes<UserLogin>,
  InferCreationAttributes<UserLogin>
> {
  @Index
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare code: CreationOptional<string>;

  @Attribute(DataTypes.STRING)
  @PrimaryKey
  @AutoIncrement
  declare loginProvider: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  declare providerKey: string;

  @Attribute(DataTypes.STRING)
  declare providerDisplayName: string;

  @Attribute(DataTypes.INTEGER)
  declare userId: number;
}
