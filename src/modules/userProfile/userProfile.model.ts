import { FieldNames } from "@common/constants/fieldNames";
import { IndexNames } from "@common/constants/indexNames";
import { TableNames } from "@common/constants/tableName";
import { Gender } from "@common/enums/gender.enum";
import { BaseModel } from "@common/models/base.model";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { Attribute, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: TableNames.UserProfile,
  timestamps: true,
  paranoid: true,
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
  @Attribute(DataTypes.STRING(100))
  declare firstName: string;

  @Attribute(DataTypes.STRING(100))
  declare lastName: string;

  @Attribute(DataTypes.ENUM(...Object.values(Gender)))
  declare gender: Gender;

  @Attribute(DataTypes.DATEONLY)
  declare dateOfBirth: string;
}
