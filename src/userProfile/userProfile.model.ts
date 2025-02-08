import { Gender } from "@common/enums/gender.enum";
import { BaseModel } from "@common/models/base.model";
import { CreationOptional, DataTypes } from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy";

export class UserProfile extends BaseModel {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  declare firstName: string;

  @Attribute(DataTypes.STRING)
  declare lastName: string;

  @Attribute(DataTypes.ENUM)
  declare gender: Gender;

  @Attribute(DataTypes.STRING)
  declare dateOfBirth: string;
}
