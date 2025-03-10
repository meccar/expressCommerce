import { CreationOptional, DataTypes, Model, sql } from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  Default,
  Index,
  NotNull,
  PrimaryKey,
} from "@sequelize/core/decorators-legacy";

export class BaseModel<T extends {} = any, U extends {} = T> extends Model<
  T,
  U
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Index
  @NotNull
  @Attribute(DataTypes.UUID.V1)
  @Default(sql.uuidV1)
  declare code: CreationOptional<string>;
  
  @Attribute(DataTypes.STRING)
  declare createdBy: string;
  
  @Attribute(DataTypes.STRING)
  declare updatedBy: string;
  
  @Attribute(DataTypes.DATE)
  declare createdAt: CreationOptional<Date>;

  @Attribute(DataTypes.DATE)
  declare updatedAt: CreationOptional<Date>;

  @Attribute(DataTypes.DATE)
  declare deletedAt: CreationOptional<Date>;

  @NotNull
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare isDeleted: boolean;
}
