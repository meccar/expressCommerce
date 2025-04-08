import { BaseModel, TableNames } from '@common/index';
import { DataTypes, InferAttributes, InferCreationAttributes } from '@sequelize/core';
import { Attribute, Table } from '@sequelize/core/decorators-legacy';
import { NotEmpty } from '@sequelize/validator.js';

@Table({
  tableName: TableNames.Categories,
})
export class Category extends BaseModel<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  @Attribute(DataTypes.STRING)
  @NotEmpty({ msg: "Please enter the category's name" })
  declare name: string;
}
