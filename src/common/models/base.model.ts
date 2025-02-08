import { CreationOptional, DataTypes } from "@sequelize/core";
import { Attribute, Default } from "@sequelize/core/decorators-legacy";

export class BaseModel {
  declare createdAt: CreationOptional<Date>;

  @Attribute(DataTypes.STRING)
  declare createdBy: string;

  declare updatedAt: CreationOptional<Date>;

  @Attribute(DataTypes.STRING)
  declare updateBy: string;

  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isDeleted: boolean;

  declare deletedAt: CreationOptional<Date>;
}
