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
import {
  Is,
  IsAlphanumeric,
  IsDecimal,
  IsEmail,
  IsNumeric,
  Len,
  Max,
  Min,
  NotEmpty,
} from '@sequelize/validator.js';

import { BaseModel, TableNames, Ulid } from '@common/index';

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
  @Index
  declare email: string;

  @Attribute(DataTypes.STRING(100))
  @NotEmpty({ msg: 'Please enter your username' })
  @Min({ args: [3], msg: 'Username must be at least 3 characters' })
  @Max({ args: [30], msg: 'Username cannot exceed 30 characters' })
  @Index
  declare username: string;

  @Attribute(DataTypes.STRING(255))
  @NotNull
  @NotEmpty({ msg: 'Please enter your password' })
  @Len({ args: [8, 100], msg: 'Password must be between 8 and 100 characters' })
  // @Is({
  //   args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  //   msg: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  // })
  declare password: string;

  @Attribute(DataTypes.STRING(100))
  @AllowNull
  declare passwordRecoveryToken: string | null;

  @Attribute(DataTypes.STRING(100))
  @AllowNull
  declare confirmToken: string | null;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  declare isTwoFactorVerified: boolean;

  @Attribute(DataTypes.STRING(32))
  @AllowNull
  declare twoFactorSecret: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  @Index
  declare emailConfirmed: boolean;

  @Attribute(DataTypes.UUID.V1)
  @Default(sql.uuidV1)
  @NotNull
  declare securityStamp: string;

  @Attribute(DataTypes.STRING(20))
  @IsDecimal({ msg: 'Please enter a valid phone number' })
  @NotEmpty({ msg: 'Please enter your phone number' })
  @IsAlphanumeric({ msg: 'Phone number must contain only numbers' })
  @Len({ args: [10, 15], msg: 'Phone number must be between 10 and 15 digits' })
  @Index
  declare phoneNumber: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  declare phoneNumberConfirmed: boolean;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  declare twoFactorEnabled: boolean;

  @Attribute(DataTypes.DATE)
  @AllowNull
  declare lockoutEnd: Date | null;

  @Attribute(DataTypes.BOOLEAN)
  @Default(true)
  @NotNull
  declare lockoutEnabled: boolean;

  @Attribute(DataTypes.INTEGER)
  @Default(0)
  @NotNull
  declare accessFailedCount: number;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  @NotNull
  @Index
  declare isActive: boolean;
}
