import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, AutoIncrement, NotNull, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserClaim",
  underscored: true,
})
export class UserClaim extends Model<
  InferAttributes<UserClaim>,
  InferCreationAttributes<UserClaim>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @NotNull
  @Attribute(DataTypes.STRING(20))
  declare userAccountCode: string;

  @Attribute(DataTypes.STRING)
  declare claimType: string 
  
  @Attribute(DataTypes.STRING)
  declare claimValue: string 
}
