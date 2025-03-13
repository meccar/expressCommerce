import { BaseModel, baseTableOptions } from "@common/index";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { Attribute, NotNull, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserRole",
  ...baseTableOptions,
})
export class UserRole extends BaseModel<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  @NotNull
  @Attribute(DataTypes.UUID.V1)
  declare userAccountCode: string;

  @NotNull
  @Attribute(DataTypes.UUID.V1)
  declare roleCode: string;
}
