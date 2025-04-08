import { RootRepository } from '@infrastructure/index';
import { Products } from './products.model';

export class ProductRepository extends RootRepository<Products> {
  constructor() {
    super(Products);
  }
}
