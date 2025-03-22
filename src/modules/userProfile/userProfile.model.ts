import { BaseModel, Gender, TableNames } from '@common/index';
import { DataTypes, InferAttributes, InferCreationAttributes } from '@sequelize/core';
import { AllowNull, Attribute, Default, NotNull, Table } from '@sequelize/core/decorators-legacy';
import { Is, IsAfter, IsAlpha, IsBefore, IsDate } from '@sequelize/validator.js';

@Table({
  tableName: TableNames.UserProfile,
  comment: 'Stores user profile information',
})
export class UserProfile extends BaseModel<
  InferAttributes<UserProfile>,
  InferCreationAttributes<UserProfile>
> {
  @NotNull
  @Attribute(DataTypes.UUID.V1)
  declare userAccountCode: string;

  @AllowNull
  @Attribute(DataTypes.STRING(100))
  @IsAlpha({ msg: 'Name must contain only characters' })
  declare firstName?: string;

  @AllowNull
  @Attribute(DataTypes.STRING(100))
  @IsAlpha({ msg: 'Name must contain only characters' })
  declare lastName?: string;

  @Attribute(DataTypes.ENUM(...Object.values(Gender)))
  @Default(Gender.Female)
  declare gender: Gender;

  @AllowNull
  @Attribute(DataTypes.DATEONLY)
  @IsDate({ args: true, msg: 'Invalid date format' })
  @IsAfter({ args: '1900-01-01', msg: 'Date of birth must be after 1900' })
  @IsBefore({
    args: new Date().toISOString().split('T')[0],
    msg: 'Date of birth cannot be in the future',
  })
  declare dateOfBirth?: Date;
}
