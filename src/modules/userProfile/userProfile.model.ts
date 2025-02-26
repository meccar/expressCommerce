import { BaseModel, FieldNames, Gender, IndexNames, TableNames } from "@common/index";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { AllowNull, Attribute, Default, NotNull, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: TableNames.UserProfile,
  underscored: true,
  indexes: [
    // {
    //   name: IndexNames.UserProfile.Code,
    //   unique: true,
    //   fields: [FieldNames.UserProfile.Code],
    // },
    {
      name: IndexNames.UserProfile.Name,
      unique: false,
      fields: [
        FieldNames.UserProfile.FirstName,
        FieldNames.UserProfile.LastName,
      ],
    },
  ],
  comment: "Stores user profile information",
})
export class UserProfile extends BaseModel<
  InferAttributes<UserProfile>,
  InferCreationAttributes<UserProfile>
> {
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare userAccountCode: string;

  @AllowNull
  @Attribute(DataTypes.STRING(100))
  declare firstName?: string;

  @AllowNull
  @Attribute(DataTypes.STRING(100))
  declare lastName?: string;

  @Attribute(DataTypes.ENUM(...Object.values(Gender)))
  @Default(Gender.Female)
  declare gender: Gender;

  @AllowNull
  @Attribute(DataTypes.DATEONLY)
  declare dateOfBirth?: string;
}
