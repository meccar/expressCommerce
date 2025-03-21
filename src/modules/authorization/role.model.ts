import { BaseModel, baseTableOptions, TableNames } from '@common/index';
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from '@sequelize/core';
import { Attribute, NotNull, Table } from '@sequelize/core/decorators-legacy';

@Table({
  tableName: TableNames.Role,
  // ...baseTableOptions,
  hooks: {
    beforeCreate(data: Role) {
      data.concurrencyStamp = new Date().getTime().toString();
    },
  },
})
export class Role extends BaseModel<InferAttributes<Role>, InferCreationAttributes<Role>> {
  @NotNull
  @Attribute(DataTypes.STRING(255))
  declare name: string;

  @Attribute(DataTypes.STRING)
  declare concurrencyStamp: CreationOptional<string>;
}
