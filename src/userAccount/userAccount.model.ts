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
  Default,
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
  declare userName: string;

  @NotNull
  @Attribute(DataTypes.STRING)
  declare password: string;

  @Attribute(DataTypes.STRING)
  declare passwordRecoveryToken: string;

  @Attribute(DataTypes.STRING)
  declare confirmToken: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isTwoFactorVerified: boolean;

  @Attribute(DataTypes.STRING)
  declare twoFactorSecret: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare emailConfirmed: boolean;

  @Attribute(DataTypes.STRING)
  declare securityStamp: string;

  @Attribute(DataTypes.STRING)
  declare phoneNumber: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare phoneNumberConfirmed: boolean;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare twoFactorEnabled: boolean;

  declare lockoutEnd: CreationOptional<Date>;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare lockoutEnabled: boolean;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare accessFailedCount: number;
}
