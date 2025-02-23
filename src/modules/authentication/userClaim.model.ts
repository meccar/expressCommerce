import { BaseModel } from "@common/models/base.model";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "@sequelize/core";
import { Attribute, NotNull, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserClaim",
  underscored: true,
  indexes: [
    {
      name: "idx_userclaim_roleid",
      fields: ["role_id"],
    },
  ],
})
export class UserClaim extends BaseModel<
  InferAttributes<UserClaim>,
  InferCreationAttributes<UserClaim>
> {
  @NotNull
  @Attribute(DataTypes.INTEGER)
  declare roleId: number;
}
