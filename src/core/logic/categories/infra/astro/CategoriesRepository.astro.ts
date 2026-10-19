import { getCollection } from 'astro:content'
import type { CategorySource } from '@/core/logic/categories/domain/CategorySource'
import type { ICategoriesRepository } from '@/core/logic/categories/infra/interfaces/ICategoriesRepository'

class AstroCategoriesRepository implements ICategoriesRepository {
  async list(): Promise<CategorySource[]> {
    const categories = await getCollection('categories')

    return categories
  }
}

export default AstroCategoriesRepository
