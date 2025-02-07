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
  tableName: "userAccount",
  indexes: [
    {
      unique: true,
      fields: ["email", "version"],
    },
  ],
  // hooks: {
  //   beforeValidate(userAccount: UserAccount) {
  //     userAccount.is
  //   }
  // }
})
export class UserAccount extends Model<
  InferAttributes<UserAccount>,
  InferCreationAttributes<UserAccount>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @NotNull
  @Attribute(DataTypes.STRING)
  declare email: string;

  @NotNull
  @Attribute(DataTypes.STRING)
  declare password: string;

  @Attribute({ type: DataTypes.INTEGER, defaultValue: 0 })
  declare version: number;
}
