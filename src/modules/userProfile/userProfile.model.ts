import { BaseModel, baseTableOptions, Gender, TableNames } from "@common/index";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import {
  AllowNull,
  Attribute,
  Default,
  NotNull,
  Table,
} from "@sequelize/core/decorators-legacy";

@Table({
  tableName: TableNames.UserProfile,
  ...baseTableOptions,
  comment: "Stores user profile information",
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
