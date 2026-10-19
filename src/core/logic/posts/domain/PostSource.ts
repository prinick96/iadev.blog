import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

type PostSourceData = Omit<Post, 'id' | 'category_ids'> & {
  categories?: readonly Pick<Category, 'id'>[]
}

export type PostSource = {
  id: string
  data: PostSourceData
}
