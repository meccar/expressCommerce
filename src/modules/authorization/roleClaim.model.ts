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
  tableName: "RoleClaim",
  underscored: true,
  indexes: [
    {
      name: "idx_roleclaim_rolecode",
      fields: ["role_code"],
    },
  ],
})
export class RoleClaim extends Model<
  InferAttributes<RoleClaim>,
  InferCreationAttributes<RoleClaim>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;
  
  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare roleCode: string;

  @Attribute(DataTypes.STRING)
  declare claimType: string;

  @Attribute(DataTypes.STRING)
  declare claimValue: string;
}
