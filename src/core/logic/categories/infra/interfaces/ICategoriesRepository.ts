import type { CategorySource } from '@/core/logic/categories/domain/CategorySource'

export interface ICategoriesRepository {
  list(): Promise<CategorySource[]>
}
