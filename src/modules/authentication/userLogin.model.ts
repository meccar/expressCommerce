import { DataTypes, InferAttributes, InferCreationAttributes, Model } from '@sequelize/core';
import { Attribute, PrimaryKey, Table } from '@sequelize/core/decorators-legacy';

@Table({
  tableName: 'UserLogin',
  underscored: true,
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

  @Attribute(DataTypes.STRING(20))
  @PrimaryKey
  declare userAccountCode: string;
}
