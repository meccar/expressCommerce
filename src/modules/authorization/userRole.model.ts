import { BaseModel } from "@common/index";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import {
  Attribute,
  NotNull,
  Table,
} from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserRole",
  underscored: true,
})
export class UserRole extends BaseModel<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare userCode: string;

  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare roleCode: string;
}
