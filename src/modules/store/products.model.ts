import { BaseModel, TableNames } from '@common/index';
import { DataTypes, InferAttributes, InferCreationAttributes } from '@sequelize/core';
import { Attribute, Table } from '@sequelize/core/decorators-legacy';
import { NotEmpty } from '@sequelize/validator.js';

@Table({
  tableName: TableNames.Products,
})
export class Products extends BaseModel<
  InferAttributes<Products>,
  InferCreationAttributes<Products>
> {
  @Attribute(DataTypes.STRING(255))
  @NotEmpty({ msg: "Please enter the product's name" })
  declare name: string;

  @Attribute(DataTypes.FLOAT)
  @NotEmpty({ msg: "Please enter the product's price" })
  declare price: number;

  @Attribute(DataTypes.STRING(500))
  declare description: string;
}
