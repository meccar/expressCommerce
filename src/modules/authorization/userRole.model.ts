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
  indexes: [
    {
      name: "idx_userrole_usercode",
      fields: ["user_code"],
    },
    {
      name: "idx_userrole_rolecode",
      fields: ["role_code"],
    },
  ],
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
