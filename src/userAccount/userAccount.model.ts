import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Op,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  Default,
  Index,
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserAccount",
  underscored: true,
  indexes: [
    {
      name: "idx_user_accounts_email",
      unique: true,
      fields: ["email"],
    },
    {
      name: "idx_user_accounts_username",
      unique: true,
      fields: ["user_name"],
    },
    {
      name: "idx_user_accounts_phone",
      unique: true,
      fields: ["phone_number"],
      where: {
        phone_number: {
          [Op.ne]: null,
        },
      },
    },
  ],
  comment: "Stores user authentication and security information",
})
export class UserAccount extends Model<
  InferAttributes<UserAccount>,
  InferCreationAttributes<UserAccount>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Index
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare code: CreationOptional<string>;

  @NotNull
  @Attribute(DataTypes.STRING(255))
  declare email: string;

  @NotNull
  @Attribute(DataTypes.STRING(100))
  declare userName: string;

  @NotNull
  @Attribute(DataTypes.STRING(255))
  declare password: string;

  @Attribute(DataTypes.STRING(100))
  declare passwordRecoveryToken: string;

  @Attribute(DataTypes.STRING(100))
  declare confirmToken: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isTwoFactorVerified: boolean;

  @Attribute(DataTypes.STRING(32))
  declare twoFactorSecret: string;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare emailConfirmed: boolean;

  @NotNull
  @Attribute(DataTypes.STRING(36))
  declare securityStamp: string;

  @Attribute(DataTypes.STRING(20))
  declare phoneNumber: string;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare phoneNumberConfirmed: boolean;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare twoFactorEnabled: boolean;

  declare lockoutEnd: CreationOptional<Date>;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare lockoutEnabled: boolean;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(0)
  declare accessFailedCount: number;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(true)
  declare isActive: boolean;
}
