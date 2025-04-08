import { RootRepository } from '@infrastructure/index';
import { Category } from './category.model';

export class CategoryRepository extends RootRepository<Category> {
  constructor() {
    super(Category);
  }
}
