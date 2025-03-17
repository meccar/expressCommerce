import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  NotNull,
  PrimaryKey,
  Table,
} from '@sequelize/core/decorators-legacy';

@Table({
  tableName: 'RoleClaim',
  underscored: true,
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
  @Attribute(DataTypes.UUID.V1)
  declare roleCode: string;

  @Attribute(DataTypes.STRING)
  declare claimType: string;

  @Attribute(DataTypes.STRING)
  declare claimValue: string;
}
