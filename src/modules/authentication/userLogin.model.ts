import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, PrimaryKey, Table } from "@sequelize/core/decorators-legacy";

@Table({
  tableName: "UserLogin",
  underscored: true,
  // indexes: [
  //   {
  //     name: "idx_userlogin_userid",
  //     fields: ["user_id"],
  //   },
  // ],
})
export class UserLogin extends Model<
  InferAttributes<UserLogin>,
  InferCreationAttributes<UserLogin>
> {
  @Attribute(DataTypes.STRING)
  declare loginProvider: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  declare providerKey: string;

  @Attribute(DataTypes.STRING)
  declare providerDisplayName: string;

  @Attribute(DataTypes.STRING(20))
  @PrimaryKey
  declare userCode: string;
}
