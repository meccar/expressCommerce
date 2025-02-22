import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  Index,
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy";

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
export class UserClaim extends Model<
  InferAttributes<UserClaim>,
  InferCreationAttributes<UserClaim>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Index
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare code: CreationOptional<string>;

  @NotNull
  @Attribute(DataTypes.INTEGER)
  declare roleId: number;
}
