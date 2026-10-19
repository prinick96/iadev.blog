import ConvertCategory from '@/core/logic/categories/application/ConvertCategory'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { ICategoriesRepository } from '@/core/logic/categories/infra/interfaces/ICategoriesRepository'

class GetCategories {
  constructor(private readonly repository: ICategoriesRepository) {}

  async execute(): Promise<Category[]> {
    const entries = await this.repository.list()

    return entries.map(ConvertCategory.execute)
  }
}

export default GetCategories
