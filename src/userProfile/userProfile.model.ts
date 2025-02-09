import { Gender } from "@common/enums/gender.enum";
import { BaseModel } from "@common/models/base.model";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
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
  tableName: "UserProfile",
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    {
      name: "idx_user_profiles_code",
      unique: true,
      fields: ["code"],
    },
    {
      name: "idx_user_profiles_name",
      unique: false,
      fields: ["firstName", "lastName"],
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
