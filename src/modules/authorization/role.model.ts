import { BaseModel } from "@common/models/base.model";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { Attribute, NotNull, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "Role",
  underscored: true,
  indexes: [
    {
      name: "idx_role_name",
      unique: true,
      fields: ["name"],
    },
  ],
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
