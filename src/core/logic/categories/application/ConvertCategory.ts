import type { Category } from '@/core/logic/categories/domain/Category'
import type { CategorySource } from '@/core/logic/categories/domain/CategorySource'

class ConvertCategory {
  static execute({ id, data }: CategorySource): Category {
    return {
      id,
      name: data.name,
      description: data.description,
    }
  }
}

export default ConvertCategory
