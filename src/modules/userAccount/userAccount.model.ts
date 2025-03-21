import { BaseModel, TableNames, Ulid } from '@common/index';
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  sql,
} from '@sequelize/core';
import {
  AllowNull,
  Attribute,
  Default,
  Index,
  NotNull,
  PrimaryKey,
  Table,
} from '@sequelize/core/decorators-legacy';
import { IsDecimal, IsEmail, NotEmpty } from '@sequelize/validator.js';

@Table({
  tableName: TableNames.UserAccount,
  comment: 'Stores user authentication and security information',
  hooks: {
    beforeCreate(data: UserAccount) {
      data.confirmToken = Ulid.generateUlid();
    },
    afterCreate(data: UserAccount) {
      data.password = '';
    },
  },
})
export class UserAccount extends BaseModel<
  InferAttributes<UserAccount>,
  InferCreationAttributes<UserAccount>
> {
  @Attribute(DataTypes.STRING(255))
  @IsEmail({ msg: 'Please enter a valid email' })
  @NotEmpty({ msg: 'Please enter your email' })
  declare email: string;

  @Attribute(DataTypes.STRING(100))
  @NotEmpty({ msg: 'Please enter your username' })
  declare username: string;

  @Attribute(DataTypes.STRING(255))
  @NotNull
  @NotEmpty({ msg: 'Please enter your password' })
  declare password: string;

  @Attribute(DataTypes.STRING(100))
  @AllowNull
  declare passwordRecoveryToken: string | null;

  @Attribute(DataTypes.STRING(100))
  declare confirmToken: string | null;

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
  @Attribute(DataTypes.UUID.V1)
  @Default(sql.uuidV1)
  declare securityStamp: string;

  @Attribute(DataTypes.STRING(20))
  @IsDecimal({ msg: 'Please enter a valid phone number' })
  @NotEmpty({ msg: 'Please enter your phone number' })
  declare phoneNumber: string;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare phoneNumberConfirmed: boolean;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare twoFactorEnabled: boolean;

  @Attribute(DataTypes.DATE)
  @AllowNull
  declare lockoutEnd: Date | null;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare lockoutEnabled: boolean;

  @NotNull
  @Attribute(DataTypes.INTEGER)
  @Default(0)
  declare accessFailedCount: number;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isActive: boolean;
}
