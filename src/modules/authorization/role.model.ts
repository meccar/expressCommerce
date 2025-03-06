import { BaseModel } from "@common/index";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, AutoIncrement, Index, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "Role",
  underscored: true,
})
export class Role extends BaseModel<
  InferAttributes<Role>,
  InferCreationAttributes<Role>
> {
  @NotNull
  @Attribute(DataTypes.STRING(256))
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare concurrencyStamp: CreationOptional<string>;
}
