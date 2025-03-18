import { TableNames } from '@common/index';
import { DataTypes, InferAttributes, InferCreationAttributes, Model } from '@sequelize/core';
import { Attribute, PrimaryKey, Table } from '@sequelize/core/decorators-legacy';

@Table({
  tableName: TableNames.UserLogin,
})
export class UserLogin extends Model<
  InferAttributes<UserLogin>,
  InferCreationAttributes<UserLogin>
> {
  @Attribute(DataTypes.STRING)
  declare loginProvider: string;

  @Attribute(DataTypes.STRING)
  declare providerKey: string;

  @Attribute(DataTypes.STRING)
  declare providerDisplayName: string;

  @Attribute(DataTypes.UUID.V1)
  @PrimaryKey
  declare userAccountCode: string;
}
