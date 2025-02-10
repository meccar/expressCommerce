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
  NotNull,
  PrimaryKey,
  Table,
} from "@sequelize/core/decorators-legacy";

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
export class Role extends Model<
  InferAttributes<Role>,
  InferCreationAttributes<Role>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @NotNull
  @Attribute(DataTypes.STRING(256))
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare concurrencyStamp: CreationOptional<string>;
}
